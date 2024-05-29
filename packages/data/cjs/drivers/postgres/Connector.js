"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
const _jacaranda = require("@kitmi/jacaranda");
const _Connector = require("../../Connector");
const _Connector1 = /*#__PURE__*/ _interop_require_default(require("../relational/Connector"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const pg = _jacaranda.runtime.get(_jacaranda.NS_MODULE, 'pg');
const { Pool, Client, escapeLiteral, escapeIdentifier } = pg;
const connSym = Symbol.for('conn');
const tranSym = Symbol.for('tran');
/**
 * SQL execution sequence
 * FROM clause
 * WHERE clause
 * GROUP BY clause
 * HAVING clause
 * SELECT clause
 * ORDER BY clause
 */ /**
 * Postgres data storage connector.
 * @class
 * @extends Connector
 */ class PostgresConnector extends _Connector1.default {
    typeCast(value) {
        const t = typeof value;
        if (t === 'boolean') return value ? 1 : 0;
        if (t === 'object') {
            if (value != null && value.isLuxonDateTime) {
                return value.toISO({
                    includeOffset: false
                });
            }
        }
        return value;
    }
    specParamToken(index) {
        return `$${index}`;
    }
    specInClause(index) {
        /*
         * @see https://github.com/brianc/node-postgres/wiki/FAQ#11-how-do-i-build-a-where-foo-in--query-to-find-rows-matching-an-array-of-values
         */ return ` = ANY ($${index})`; // mysql ' IN (?)'
    }
    specNotInClause(index) {
        return ` <> ALL ($${index})`; // mysql ' NOT IN (?)'
    }
    specCsvSetHas(fieldName, value) {
        // mysql 'FIND_IN_SET(?, ?) > 0'
        return `(${fieldName} @> ARRAY[${value}])`;
    }
    /**
     * Close all connection initiated by this connector.
     */ async end_() {
        if (this.acitveClients.size > 0) {
            for (const client of this.acitveClients){
                await this.disconnect_(client);
            }
        }
        if (this.pool) {
            await this.pool.end();
            if (this.options.logConnection) {
                this.app.log('info', `Close connection pool "${this.pool[connSym]}".`);
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
     */ async connect_(options) {
        if (options) {
            const connProps = {};
            if (options.createDatabase) {
                // remove the database from connection
                connProps.database = '';
            }
            const csKey = _utils._.isEmpty(connProps) ? null : this.makeNewConnectionString(connProps);
            if (csKey && csKey !== this.connectionString) {
                // create standalone connection
                const client = new Client((0, _Connector.connectionStringToObject)(csKey, this.driver));
                await client.connect();
                if (this.options.logConnection) {
                    const connStrForDisplay = this.getConnectionStringWithoutCredential(csKey);
                    client[connSym] = connStrForDisplay;
                    this.app.log('info', `Create non-pool connection to "${connStrForDisplay}".`);
                }
                return client;
            }
        }
        if (!this.pool) {
            this.pool = new Pool((0, _Connector.connectionStringToObject)(this.connectionString));
            this.pool.on('error', (err)=>{
                this.app.logError(err, 'Unexpected error on idle postgres client');
            });
            if (this.options.logConnection) {
                const connStrForDisplay = this.getConnectionStringWithoutCredential();
                this.pool[connSym] = connStrForDisplay;
                this.pool.on('connect', ()=>{
                    this.app.log('info', 'info', `Create connection pool to "${connStrForDisplay}".`, {
                        connections: this.pool.totalCount
                    });
                });
            }
        }
        const client = await this.pool.connect();
        this.acitveClients.add(client);
        if (this.options.logConnection) {
            this.app.log('info', `Get connection from pool "${this.pool[connSym]}".`);
        }
        return client;
    }
    /**
     * Close a database connection.
     * @param {Client} client - Postgres client connection.
     */ async disconnect_(client) {
        delete client[tranSym];
        if (this.acitveClients.has(client)) {
            if (this.options.logConnection) {
                this.app.log('info', `Release connection to pool "${this.pool[connSym]}".`);
            }
            this.acitveClients.delete(client);
            return client.release();
        } else {
            if (this.options.logConnection) {
                this.app.log('info', `Disconnect non-pool connection to "${client[connSym]}".`);
            }
            delete client[connSym];
            // not created by pool
            return client.end();
        }
    }
    /**
     * Start a transaction. Must catch error and rollback if failed!
     * @returns {Promise.<Client>}
     */ async beginTransaction_() {
        const client = await this.connect_();
        const tid = client[tranSym] = ++this.transactionId;
        this.app.log('verbose', `Begins a new transaction [id: ${tid}].`);
        await client.query('BEGIN');
        return client;
    }
    /**
     * Commit a transaction.
     * @param {Client} client - Postgres client connection.
     */ async commit_(client) {
        try {
            await client.query('COMMIT');
            const tid = client[tranSym];
            this.app.log('verbose', `Commits a transaction [id: ${tid}].`);
        } finally{
            this.disconnect_(client);
        }
    }
    /**
     * Rollback a transaction.
     * @param {Client} client - Postgres client connection.
     */ async rollback_(client) {
        try {
            await client.query('ROLLBACK;');
            const tid = client[tranSym];
            this.app.log('verbose', `Rollbacks a transaction [id: ${tid}].`);
        } finally{
            this.disconnect_(client);
        }
    }
    /**
     * Execute the sql statement.
     *
     * @param {String} sql - The SQL statement to execute.
     * @param {object} params - Parameters to be placed into the SQL statement.
     * @param {object} [options] - Execution options.
     * @property {string} [options.usePrepared] - Whether to use prepared statement which is cached and re-used by connection.
     * @property {boolean} [options.rowsAsArray] - To receive rows as array of columns instead of hash with column name as key.
     * @param {Client} [connection] - Existing connection.
     * @returns {Promise.<object>}
     */ async execute_(sql, params, options, connection) {
        let conn;
        const { usePrepared, rowsAsArray } = options || {};
        try {
            conn = connection ?? await this.connect_();
            const query = {
                text: sql,
                values: params
            };
            if (this.options.logStatement) {
                const meta = {
                    ...options,
                    params
                };
                if (connection) {
                    meta.transaction = connection[tranSym];
                }
                this.app.log('verbose', sql, meta);
            }
            if (usePrepared) {
                if (typeof usePrepared !== 'string') {
                    throw new _types.InvalidArgument('The `postgres` connector requires `usePrepared` to be a string as a unique name of the query.');
                }
                query.name = usePrepared;
                if (rowsAsArray) {
                    query.rowMode = 'array';
                }
            }
            const res = await conn.query(query);
            this.executedCount++;
            return res;
        } catch (err) {
            err.info || (err.info = {});
            Object.assign(err.info, options);
            err.info.sql = sql;
            err.info.params = params;
            throw err;
        } finally{
            if (conn && !connection) {
                await this.disconnect_(conn);
            }
        }
    }
    /**
     * Ping the database to check if it is alive.
     * @returns {Promise.<boolean>}
     */ async ping_() {
        const res = await this.execute_('SELECT 1 AS result');
        return res && res.rows[0] === 1;
    }
    /**
     * Create a new instance of the connector.
     * @param {App} app
     * @param {string} connectionString
     * @param {object} options
     */ constructor(app, connectionString, options){
        super(app, 'postgres', connectionString, options);
        _define_property(this, "escapeValue", escapeLiteral);
        _define_property(this, "escapeId", escapeIdentifier);
        this.acitveClients = new WeakSet();
        this.executedCount = 0;
        this.transactionId = 0;
    }
}
_define_property(PostgresConnector, "windowFunctions", new Set([
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
    'ROW_NUMBER'
]));
_define_property(PostgresConnector, "windowableFunctions", new Set([
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
    'VAR_SAMP'
]));
PostgresConnector.driverLib = pg;
const _default = PostgresConnector;

//# sourceMappingURL=Connector.js.map