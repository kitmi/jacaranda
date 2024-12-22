import { _, isEmpty } from '@kitmi/utils';
import { InvalidArgument, ApplicationError } from '@kitmi/types';
import { runtime, NS_MODULE } from '@kitmi/jacaranda';
import { tryRequire } from '@kitmi/sys';

import { connectionStringToObject } from '../../Connector';
import RelationalConnector from '../relational/Connector';

import { isRawSql, extractRawSql, concateParams } from '../../helpers';

const pg = runtime.get(NS_MODULE, 'pg') ?? tryRequire('pg');

pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (stringValue) => stringValue?.split(' ').join('T'));

const { Pool, Client, escapeLiteral, escapeIdentifier } = pg;

const connSym = Symbol.for('conn');
const tranSym = Symbol.for('tran');

const RESERVED_ALIAS = new Set(['EXCLUDED']);

/**
 * SQL execution sequence
 * FROM clause
 * WHERE clause
 * GROUP BY clause
 * HAVING clause
 * SELECT clause
 * ORDER BY clause
 */

/**
 * Postgres data storage connector.
 * @class
 * @extends Connector
 */
class PostgresConnector extends RelationalConnector {
    static windowFunctions = new Set([
        'CUME_DIST',
        'DENSE_RANK',
        'FIRST_VALUE',
        'LAG',
        'LAST_VALUE',
        'LEAD',
        'NTH_VALUE',
        'NTILE',
        'PERCENT_RANK',
        'RANK',
        'ROW_NUMBER',
    ]);

    static windowableFunctions = new Set([
        'AVG',
        'BIT_AND',
        'BIT_OR',
        'BIT_XOR',
        'COUNT',
        'JSON_ARRAYAGG',
        'JSON_OBJECTAGG',
        'MAX',
        'MIN',
        'STDDEV_POP',
        'STDDEV',
        'STD',
        'STDDEV_SAMP',
        'SUM',
        'VAR_POP',
        'VARIANCE',
        'VAR_SAMP',
    ]);

    escapeValue = escapeLiteral;
    escapeId = escapeIdentifier;

    /**
     * Create a new instance of the connector.
     * @param {App} app
     * @param {string} connectionString
     * @param {object} options
     */
    constructor(app, connectionString, options) {
        super(app, 'postgres', connectionString, options);

        this.acitveClients = new WeakSet();
        this.executedCount = 0;
        this.transactionId = 0;
    }

    /**
     * [override] Database sub-collection.
     * @member {string}
     */
    get collection() {
        if (!this._dbSchema) {
            this._dbSchema = new URL(this.connectionString).searchParams.get('schema') || 'public';
        }

        return this._dbSchema;
    }

    /**
     * [override] Get the db name to be used in cross-db join.
     * @member {string}
     */
    get crossJoinDbName() {
        return this.collection;
    }

    get specInClause() {
        /*
         * @see https://github.com/brianc/node-postgres/wiki/FAQ#11-how-do-i-build-a-where-foo-in--query-to-find-rows-matching-an-array-of-values
         */
        return ` = ANY (${this.specParamToken})`; // mysql ' IN (?)'
    }

    get specNotInClause() {
        return ` <> ALL (${this.specParamToken})`; // mysql ' NOT IN (?)'
    }

    get reservedAlias() {
        return RESERVED_ALIAS;
    }

    /**
     * Close all connection initiated by this connector.
     */
    async end_() {
        if (this.acitveClients.size > 0) {
            for (const client of this.acitveClients) {
                await this.disconnect_(client);
            }
        }

        if (this.pool) {
            await this.pool.end();
            if (this.options.logConnection) {
                this.app.log('info', `${this.driver}: closed connection pool "${this.pool[connSym]}".`);
            }
            delete this.pool[connSym];
            delete this.pool;
        }
    }

    /**
     * Create a database connection based on the default connection string of the connector and given options.
     * @param {Object} [options] - Extra options for the connection, optional.
     * @property {bool} [options.createDatabase=false] - Flag to used when creating a database.
     * @returns {Promise.<Client>}
     */
    async connect_(options) {
        if (options) {
            let connProps;

            if (options.createDatabase) {
                // remove the database from connection
                if (!this.options.adminCredential) {
                    throw new InvalidArgument(
                        `"dataSource.postgres.${this.options.connectorName}.adminCredential" is required to connect with "createDatabase" option.`
                    );
                }

                connProps = {
                    username: this.options.adminCredential.username,
                    password: this.options.adminCredential.password,
                    database: 'postgres',
                };
            }

            const csKey = connProps ? this.makeNewConnectionString(connProps) : null;

            if (csKey && csKey !== this.connectionString) {
                // create standalone connection
                const client = new Client(connectionStringToObject(csKey, this.driver));
                await client.connect();

                if (this.options.logConnection) {
                    const connStrForDisplay = this.getConnectionStringWithoutCredential(csKey);
                    client[connSym] = connStrForDisplay;

                    this.app.log('info', `${this.driver}: create non-pool connection to "${connStrForDisplay}".`);
                }

                return client;
            }
        }

        if (!this.pool) {
            this.pool = new Pool(connectionStringToObject(this.connectionString));

            this.pool.on('error', (err) => {
                this.app.logError(err, `${this.driver}: unexpected error on idle postgres client`);
            });

            if (this.options.logConnection) {
                const connStrForDisplay = this.getConnectionStringWithoutCredential();
                this.pool[connSym] = connStrForDisplay;

                this.pool.on('connect', () => {
                    this.app.log('info', `${this.driver}: create connection pool to "${connStrForDisplay}".`, {
                        connections: this.pool.totalCount,
                    });
                });
            }
        }

        const client = await this.pool.connect();
        this.acitveClients.add(client);

        if (this.options.logConnection) {
            this.app.log('info', `${this.driver}: get connection from pool "${this.pool[connSym]}".`);
        }

        return client;
    }

    /**
     * Close a database connection.
     * @param {Client} client - Postgres client connection.
     */
    async disconnect_(client) {
        delete client[tranSym];

        if (this.acitveClients.has(client)) {
            if (this.options.logConnection) {
                this.app.log('info', `${this.driver}: release connection to pool "${this.pool[connSym]}".`);
            }
            this.acitveClients.delete(client);

            return client.release();
        } else {
            if (this.options.logConnection) {
                this.app.log('info', `${this.driver}: disconnect non-pool connection to "${client[connSym]}".`);
            }

            delete client[connSym];

            // not created by pool
            return client.end();
        }
    }

    /**
     * Start a transaction. Must catch error and rollback if failed!
     * @returns {Promise.<Client>}
     */
    async beginTransaction_() {
        const client = await this.connect_();
        const tid = (client[tranSym] = ++this.transactionId);
        if (this.options.logTransaction) {
            this.app.log('info', `${this.driver}: begins a new transaction [id: ${tid}].`);
        }
        await client.query('BEGIN');
        return client;
    }

    /**
     * Commit a transaction. [exception safe]
     * @param {Client} client - Postgres client connection.
     */
    async commit_(client) {
        try {
            await client.query('COMMIT');
            if (this.options.logTransaction) {
                const tid = client[tranSym];
                this.app.log('info', `${this.driver}: committed a transaction [id: ${tid}].`);
            }
        } finally {
            this.disconnect_(client);
        }
    }

    /**
     * Rollback a transaction. [exception safe]
     * @param {Client} client - Postgres client connection.
     */
    async rollback_(client, error) {
        try {
            await client.query('ROLLBACK;');
            const tid = client[tranSym];
            this.app.log('error', `${this.driver}: rollbacked a transaction [id: ${tid}].`, {
                type: error?.name,
                error: error.message,
                info: error.info,
            });
        } finally {
            this.disconnect_(client);
        }
    }

    /**
     * Execute the sql statement.
     *
     * @param {String} sql - The SQL statement to execute.
     * @param {object} params - Parameters to be placed into the SQL statement.
     * @param {object} [options] - Execution options.
     * @property {string} [options.$preparedKey] - Whether to use prepared statement which is cached and re-used by connection.
     * @property {boolean} [options.$asArray] - To receive rows as array of columns instead of hash with column name as key.
     * @param {Client} [connection] - Existing connection.
     * @returns {Promise.<object>}
     */
    async execute_(sql, params, options, connection) {
        if (options) {
            delete options.$entity;
        }

        if (params && params.length) {
            sql = this._replaceParamToken(sql, params);
        }

        let conn;
        const { $preparedKey, $asArray, ...connOptions } = options ?? {};

        try {
            conn = connection ?? (await this.connect_(connOptions));

            const query = {
                text: sql,
                values: params,
            };

            if (this.options.logStatement) {
                const meta = { ..._.omit(options, ['$assoc', '$data']), params };
                if (connection) {
                    meta.transactionId = connection[tranSym];
                }

                (async () => {
                    this.app.log('info', `${this.driver}: ${sql}`, meta);
                })();
            }

            if ($preparedKey) {
                if (typeof $preparedKey !== 'string') {
                    throw new InvalidArgument(
                        'The `postgres` connector requires `$preparedKey` to be a string as a unique name of the query.'
                    );
                }

                query.name = $preparedKey;
            }

            if ($asArray) {
                query.rowMode = 'array';
            }

            const res = await conn.query(query);
            this.executedCount++;

            const adapted = {
                op: res.command,
                data: res.rows,
                fields: res.fields,
                affectedRows: res.rowCount,
            };

            return adapted;
        } catch (err) {
            err.info || (err.info = {});
            Object.assign(err.info, _.omit(options, ['$assoc', '$data']));

            throw err;
        } finally {
            if (conn && !connection) {
                await this.disconnect_(conn);
            }
        }
    }

    /**
     * Ping the database to check if it is alive.
     * @returns {Promise.<boolean>}
     */
    async ping_() {
        const res = await this.execute_('SELECT 1 AS result');
        return res && res.data[0] === 1;
    }

    /**
     * Create a new entity.
     * @param {string} model
     * @param {object} data
     * @param {object} options
     * @param {Client} connection
     * @returns {object}
     */
    async create_(model, data, options, connection) {
        if (!data || isEmpty(data)) {
            throw new InvalidArgument(`Creating with empty "${model}" data.`);
        }

        let columns = '';
        let values = '';
        let params = [];

        _.each(data, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += this._packValue(v, params) + ',';
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES (${values.slice(0, -1)})`;
        if (options.$ignore) {
            sql += ' ON CONFLICT DO NOTHING';
        }

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Create a new entity from a select result.
     * @param {string} model
     * @param {object} options
     * @param {array} insertColumns
     * @param {array} uniqueKeys
     * @param {Client} connection
     * @returns {object}
     */
    async createFrom_(model, options, insertColumns, uniqueKeys, connection) {
        const sqlInfo = this.buildQuery(model, options);

        let columns = '';

        _.each(insertColumns, (v) => {
            columns += this.escapeId(v) + ',';
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) ${sqlInfo.sql}`;

        if (options.$ignore) {
            sql += ' ON CONFLICT DO NOTHING';
        } else if (options.$upsert) {
            if (typeof options.$upsert !== 'object') {
                throw new InvalidArgument('"$upsert" should be an object with data to update on conclicts.');
            }

            let conflicts = '';

            uniqueKeys.forEach((k) => {
                conflicts += this.escapeId(k) + ',';
            });

            sql +=
                ` ON CONFLICT (${conflicts.slice(0, -1)}) DO UPDATE SET ` +
                this._splitColumnsAsInput(options.$upsert, sqlInfo.params, model, {
                    [model]: model,
                    [`${model}.EXCLUDED`]: 'EXCLUDED',
                }).join(', ');
        }

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        return this.execute_(sql, sqlInfo.params, options, connection);
    }

    /**
     * Create multiple records.
     * @param {string} model
     * @param {object} fields
     * @param {array} records
     * @param {Client} connection
     * @returns {object}
     */
    async createMany_(model, fields, records, connection) {
        if (!Array.isArray(records) || records.length === 0 || !Array.isArray(records[1])) {
            throw new InvalidArgument(`"records" for createMany_ should be an two-dimension array.`);
        }

        let columns = '';
        let values = '';

        fields.forEach((field) => {
            columns += this.escapeId(field) + ',';
            values += this.specParamToken + ',';
        });

        values = `(${values.slice(0, -1)}),`;
        let valuesList = '';

        const params = records.reduce((acc, record) => {
            valuesList += values;
            return acc.concat(record);
        }, []);

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES ${valuesList.slice(0, -1)}`;
        return this.execute_(sql, params, null, connection);
    }

    /**
     * Create a new entity or update the old one if duplicate key found.
     * @param {*} model
     * @param {*} data
     * @param {*} uniqueKeys
     * @param {*} options
     * @param {object} dataOnInsert - When no duplicate record exists, extra data for inserting
     * @returns {object}
     */
    async upsert_(model, data, uniqueKeys, insertData, options, connection) {
        const dataWithoutUK = _.omit(data, uniqueKeys);

        if (isEmpty(dataWithoutUK)) {
            // if dupliate, dont need to update
            return this.create_(model, insertData, { ...options, $ignore: true }, connection);
        }

        let columns = '';
        let conflicts = '';
        let values = '';
        let params = [];

        _.each(insertData, (v, k) => {
            columns += this.escapeId(k) + ',';
            values += this._packValue(v, params) + ',';
        });

        uniqueKeys.forEach((k) => {
            conflicts += this.escapeId(k) + ',';
        });

        let sql = `INSERT INTO ${this.escapeId(model)} (${columns.slice(0, -1)}) VALUES (${values.slice(0, -1)})`;
        sql +=
            ` ON CONFLICT (${conflicts.slice(0, -1)}) DO UPDATE SET ` +
            this._splitColumnsAsInput(dataWithoutUK, params).join(', ');

        if (options.$getCreated) {
            sql += ` RETURNING ${options.$getCreated
                .map((col) => (col === '*' ? '*' : this.escapeId(col)))
                .join(', ')}`;
        }

        return this.execute_(sql, params, options, connection);
    }

    insertOne_ = this.create_;

    /**
     * Update an existing entity.
     * @param {string} model
     * @param {object} data
     * @param {*} options
     * @property {object} [options.$where] - Where conditions
     * @property {object} [options.$assoc] - Parsed relatinships
     * @property {boolean} [options.$requireSplitColumn] - Whether to use set field=value
     * @property {integer} [options.$limit]
     * @return {object}
     */
    async update_(model, data, options, connection) {
        if (isEmpty(data)) {
            throw new InvalidArgument('Data record is empty.', {
                model,
                options: _.omit(options, ['$assoc']),
            });
        }

        if (!options.$where) {
            throw new InvalidArgument('"$where" is required for updating.', {
                model,
                options: _.omit(options, ['$assoc']),
            });
        }

        const aliasMap = { [model]: 'A' };
        let mainEntityForJoin;

        let sql = '';
        let params = [];

        let joinings;
        let directJoinings;

        if (options.$assoc) {
            mainEntityForJoin = model;
            [joinings, directJoinings] = this._joinAssociations(
                options,
                options.$assoc,
                mainEntityForJoin,
                aliasMap,
                1,
                params
            );
        }

        sql += 'UPDATE ' + this.escapeId(model);

        if (mainEntityForJoin) {
            sql += ' A ';

            if (options.$assoc) {
                sql = this._concatJoinClauses(sql, directJoinings, joinings);
            }
        }

        sql += ' SET ' + this._splitColumnsAsInput(data, params, mainEntityForJoin, aliasMap).join(', ');

        const whereClause = this._joinCondition(options, options.$where, params, null, mainEntityForJoin, aliasMap);
        if (whereClause) {
            sql += ' WHERE ' + whereClause;
        }

        if (options.$getUpdated) {
            let returningFields = options.$getUpdated;

            if (returningFields === true) {
                returningFields = ['*'];
            }

            sql += ` RETURNING ${returningFields.map((col) => (col === '*' ? '*' : this.escapeId(col))).join(', ')}`;
        }

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Remove an existing entity.
     * @param {string} model
     * @param {*} deleteOptions
     * @param {*} options
     */
    async delete_(model, options, connection) {
        const aliasMap = { [model]: 'A' };
        let mainEntityForJoin;

        let sql = '';
        let params = [];

        let joinings;
        let directJoinings;

        if (options.$assoc) {
            mainEntityForJoin = model;
            [joinings, directJoinings] = this._joinAssociations(
                options,
                options.$assoc,
                mainEntityForJoin,
                aliasMap,
                1,
                params
            );
        }

        sql += 'DELETE FROM ' + this.escapeId(model);

        if (mainEntityForJoin) {
            sql += ' A ';

            if (options.$assoc) {
                sql = this._concatJoinClauses(sql, directJoinings, joinings);
            }
        }

        const whereClause = this._joinCondition(options, options.$where, params, null, mainEntityForJoin, aliasMap);
        if (whereClause) {
            sql += ' WHERE ' + whereClause;
        }

        if (options.$getDeleted) {
            let returningFields = options.$getDeleted;

            if (returningFields === true) {
                returningFields = ['*'];
            }

            sql += ` RETURNING ${returningFields.map((col) => (col === '*' ? '*' : this.escapeId(col))).join(', ')}`;
        }

        return this.execute_(sql, params, options, connection);
    }

    /**
     * Perform select operation.
     * @param {string} model
     * @param {object} findOptions
     * @param {Client} connection
     */
    async find_(model, findOptions, connection) {
        const sqlInfo = this.buildQuery(model, findOptions);
        return this._executeQuery_(sqlInfo, findOptions, connection);
    }

    _buildOrmColumns(columns, params, mainEntity, aliasMap) {
        // _ is for the main entity
        const columnsSet = { _: [] };
        columns.forEach((col) => this._buildOrmColumn(col, mainEntity, aliasMap, columnsSet));
        const columnList = [];

        columnsSet._.forEach((col) => {
            if (typeof col === 'string') {
                columnList.push(col);
            } else {
                columnList.push(col.clause);
                params.push(...col.params);
            }
        });

        delete columnsSet._;

        _.each(columnsSet, (cols, alias) => {
            if (cols.has('*')) {
                columnList.push(`row_to_json(${this.escapeId(alias)}.*) AS ${this.escapeId(alias + '$')}`);
                return;
            }

            const list = [];

            cols.forEach((col) => {
                list.push(`'${col}', ${this.escapeId(alias)}.${this.escapeId(col)}`);
            });

            const fieldSelect = `json_build_object(${list.join(', ')}) AS ${this.escapeId(alias + '$')}`;
            columnList.push(fieldSelect);
        });

        return columnList.join(', ');
    }

    _buildOrmColumn(col, mainEntity, aliasMap, columnsSet) {
        if (typeof col === 'string') {
            // it's a string if it's quoted when passed in
            if (isRawSql(col)) {
                columnsSet._.push(extractRawSql(col));
                return;
            }

            let [alias, fieldName] = this._getFieldNameWithAlias(col, mainEntity, aliasMap);
            if (alias === '_') {
                columnsSet._.push(fieldName);
                return;
            }

            if (typeof alias === 'object') {
                alias = alias.alias;
            }

            columnsSet[alias] || (columnsSet[alias] = new Set());
            if (fieldName === '*' && columnsSet[alias].size > 0) {
                columnsSet[alias] = new Set();
            } else if (columnsSet[alias].has('*')) {
                return;
            }
            columnsSet[alias].add(fieldName);
            return;
        }

        if (typeof col === 'number') {
            throw new InvalidArgument('Number literal is not supported in ORM query.');
        }

        if (typeof col === 'object' && col.$xr) {
            if (col.alias) {
                const params = [];
                const fieldSelect =
                    this._buildColumn(_.omit(col, ['alias']), params, mainEntity, aliasMap) +
                    ' AS ' +
                    this.escapeId(col.alias);
                columnsSet._.push({ clause: fieldSelect, params });
                return;
            }

            throw new InvalidArgument('Column object without an alias is not supported in ORM query.');
        }

        throw new ApplicationError(`Unknown column syntax: ${JSON.stringify(col)}`);
    }

    _getFieldNameWithAlias(fieldName, mainEntity, aliasMap) {
        if (fieldName.startsWith('::')) {
            // ::fieldName for skipping alias padding
            return ['_', this.escapeId(fieldName.substring(2))];
        }

        const rpos = fieldName.lastIndexOf('.');
        if (rpos > 0) {
            const actualFieldName = fieldName.substring(rpos + 1);
            const basePath = fieldName.substring(0, rpos);

            let aliasKey;

            if (basePath.startsWith('_.')) {
                aliasKey = basePath;
            } else {
                if (!mainEntity) {
                    throw new InvalidArgument(
                        'Cascade alias is not allowed when the query has no associated entity populated.',
                        {
                            alias: fieldName,
                        }
                    );
                }
                aliasKey = mainEntity + '.' + basePath;
            }

            const alias = aliasMap[aliasKey];

            if (!alias) {
                throw new InvalidArgument(`Column reference "${fieldName}" not found in populated associations.`, {
                    entity: mainEntity,
                    aliasMap,
                });
            }

            return [alias, actualFieldName];
        }

        if (mainEntity) {
            let alias = aliasMap[mainEntity];

            if (typeof alias === 'object') {
                alias = alias.alias;
            }

            return ['_', this.escapeId(alias) + '.' + (fieldName === '*' ? '*' : this.escapeId(fieldName))];
        }

        return ['_', fieldName === '*' ? '*' : this.escapeId(fieldName)];
    }

    _replaceParamToken(sql, params) {
        return params.reduce((_sql, p, i) => {
            return _sql.replace(`$?`, `$${i + 1}`);
        }, sql);
    }

    /**
     * Execute the read query.
     * @param {*} query
     * @param {*} queryOptions
     * @param {*} options
     * @param {*} connection
     * @returns {object} { data, affectedRows, fields, [reverseAliasMap], [totalCount] }
     */
    async _executeQuery_(query, queryOptions, connection) {
        let result, totalCount;

        if (query.countSql) {
            const res = await this.execute_(query.countSql, query.countParams, queryOptions, connection);
            totalCount = parseInt(res.data[0].count, 10);
        }

        let options = queryOptions;

        if (query.hasJoining) {
            if (!queryOptions.$skipOrm) {
                // force to return as array
                options.$asArray = true;

                //todo: changed to json_build_object
                //const wrappedSql = `SELECT row_to_json(_row) FROM (${query.sql}) _row`;
                result = await this.execute_(query.sql, query.params, options, connection);

                const reverseAliasMap = _.reduce(
                    query.aliasMap,
                    (result, alias, nodePath) => {
                        const _path = nodePath
                            .split('.')
                            .slice(
                                1
                            ); /* .map(n => ':' + n) changed to be padding by orm and can be customized with other key getter */
                        if (typeof alias === 'object') {
                            result[alias.alias] = _path;
                        } else {
                            result[alias] = _path;
                        }
                        return result;
                    },
                    {}
                );

                if (query.countSql) {
                    return { ...result, aliases: reverseAliasMap, totalCount };
                }

                return { ...result, aliases: reverseAliasMap };
            }

            if (!queryOptions.$skipOrmWarn) {
                this.app.log('warn', `${this.driver}: skip ORM for joining query may cause unexpected result.`, { query });
            }
        }

        result = await this.execute_(query.sql, query.params, options, connection);

        if (query.countSql) {
            return { ...result, totalCount };
        }

        return result;
    }
}

PostgresConnector.driverLib = pg;

export default PostgresConnector;
