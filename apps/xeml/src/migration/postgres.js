const path = require('node:path');
const { _, eachAsync_, quote, esmCheck, arrayToObject } = require('@kitmi/utils');
const { fs } = require('@kitmi/sys');
const { MetadataEntity } = require('../lang/XemlTypes');

/**
 * Postgres migration.
 * @class
 */
class PostgresMigration {
    /**
     * @param {ServiceContainer} app
     * @param {object} modelService
     * @param {Db} db
     */
    constructor(app, modelService, db) {
        this.app = app;
        this.modelPath = modelService.config.modelPath;
        this.scriptPath = modelService.config.migrationPath;
        this.db = db;

        this.dbScriptPath = path.join(this.scriptPath, this.db.driver, this.db.schemaName);
    }

    async reset_() {
        try {
            // todo: confirm before executing
            await this.db.connector.execute_(
                `DROP DATABASE IF EXISTS ${this.db.connector.escapeId(this.db.connector.database)} WITH (FORCE)`,
                null,
                {
                    createDatabase: true,
                }
            );
        } catch (e) {
            if (e.code === '3D000' && e.message.endsWith('does not exist')) {
                return;
            }

            throw e;
        }
    }

    async create_(extraOptions) {
        let sqlFiles = ['entities.sql', 'sequence.sql', 'relations.sql', 'procedures.sql', 'triggers.sql'];

        let sqlCreate = `CREATE DATABASE ${this.db.connector.escapeId(this.db.connector.database)}`;

        if (extraOptions && !_.isEmpty(extraOptions.db)) {
            sqlCreate +=
                ' ' +
                _.reduce(
                    extraOptions.db,
                    (r, v, k) => {
                        return r + ' ' + _.upperCase(k) + ' ' + quote(v.toString(), '"');
                    },
                    ''
                );
        }

        try {
            await this.db.connector.execute_(sqlCreate, null, {
                createDatabase: true,
            });
        } catch (e) {
            if (e.code === '42P04' && e.message.endsWith('already exists')) {
                this.app.log('warn', `Database "${this.db.connector.database}" already exists.`);
            }
        }

        return eachAsync_(sqlFiles, async (file) => {
            let sqlFile = path.join(this.dbScriptPath, file);
            if (!fs.existsSync(sqlFile)) {
                return;
            }

            let sql = _.trim(fs.readFileSync(sqlFile, { encoding: 'utf8' }));
            if (sql) {
                await this.db.connector.execute_(sql);
                this.app.log('info', `Database scripts "${sqlFile}" run successfully.`);
            }
        });
    }

    async up_(versionDir) {
        let sqlFiles = ['up.sql'];

        return eachAsync_(sqlFiles, async (file) => {
            let sqlFile = path.join(this.scriptPath, versionDir, file);
            if (!fs.existsSync(sqlFile)) {
                throw new Error(`Migration script "${sqlFile}" not found.`);
            }

            let sql = _.trim(fs.readFileSync(sqlFile, { encoding: 'utf8' }));
            if (sql) {
                await this.db.connector.execute_(sql);
                this.app.log('info', `Database scripts "${sqlFile}" run successfully.`);
            }
        });
    }

    async load_(dataFile, ignoreDuplicate) {
        let ext = path.extname(dataFile);
        this.app.log('verbose', `Loading data file "${dataFile}" ...`);

        if (ext === '.json') {
            let data = fs.readJsonSync(dataFile, { encoding: 'utf8' });

            if (Array.isArray(data)) {
                let entityName = path.basename(dataFile, ext);
                await this._loadSingleEntityRecords_(entityName, data, ignoreDuplicate);
            } else {
                await this._loadMultiEntityRecords_(data, ignoreDuplicate);
            }
            this.app.log('info', `Loaded JSON data file: ${dataFile}`);
        } else if (ext === '.sql') {
            let sql = fs.readFileSync(dataFile, { encoding: 'utf8' });
            let result = await this.db.connector.execute_(sql);
            this.app.log('info', `Executed SQL file: ${dataFile}`, result);
        } else if (ext === '.xlsx') {
            const Excel = require('exceljs');
            let workbook = new Excel.Workbook();
            await workbook.xlsx.readFile(dataFile);

            let data = {};

            workbook.eachSheet((worksheet, sheetId) => {
                let colKeys;

                let entityName = worksheet.name;
                let entityData = [];
                data[entityName] = entityData;

                worksheet.eachRow(function (row, rowNumber) {
                    if (!colKeys) {
                        colKeys = _.drop(row.values);
                    } else {
                        let record = _.fromPairs(_.zip(colKeys, _.drop(row.values)));
                        entityData.push(record);
                    }
                });
            });

            await this._loadMultiEntityRecords_(data);

            this.app.log('info', `Imported excel data file: ${dataFile}`);
        } else if (ext === '.js') {
            let executor = esmCheck(require(path.resolve(dataFile)));
            await executor(this.db);

            this.app.log('info', `Ran data script: ${dataFile}`);
        } else {
            throw new Error('Unsupported data file format.');
        }
    }

    writeIndexFile(outputDir, items) {
        const indexFile = path.join(outputDir, 'index.list');

        fs.writeFileSync(indexFile, items.join('\n'), 'utf8');
        this.app.log('info', 'Generated data files list: ' + indexFile);
    }

    async export_(entitiesToExport, outputDir, skipIndexFile) {
        fs.ensureDirSync(outputDir);

        const items = [];

        await eachAsync_(entitiesToExport, async (exportConfig, dataFileName) => {
            const entityName = exportConfig.entityName || dataFileName;
            this.app.log('verbose', 'Exporting data of entity: ' + entityName);

            const Entity = this.db.entity(entityName);
            //console.log(exportConfig.dataset);
            const data = await Entity.findAll_(exportConfig.dataset);

            _.forOwn(exportConfig.rules, (enabled, name) => {
                if (enabled) {
                    const processRule = require(`./rules/${name}.js`);
                    data.forEach((entity) => processRule(this.db, Entity, entity));
                }
            });

            const baseFileName = `${dataFileName}.json`;
            items.push(baseFileName);

            const dataFile = path.join(outputDir, baseFileName);

            fs.writeJsonSync(
                dataFile,
                {
                    [Entity.meta.name]: data,
                },
                { spaces: 4 }
            );

            this.app.log('info', 'Generated entity data file: ' + dataFile);
        });

        if (!skipIndexFile) {
            this.writeIndexFile(outputDir, items);
        }

        return items;
    }

    async _loadMultiEntityRecords_(data, ignoreDuplicate) {
        try {
            await this.db.connector.execute_("SET session_replication_role = 'replica';");

            await eachAsync_(data, async (records, entityName) => {
                let items = Array.isArray(records) ? records : [records];
                return this._loadRecordsByModel_(entityName, items, ignoreDuplicate);
            });
        } catch (error) {
            throw error;
        } finally {
            await this.db.connector.execute_("SET session_replication_role = 'origin';");
        }
    }

    async _loadSingleEntityRecords_(entityName, data, ignoreDuplicate) {
        try {
            await this.db.connector.execute_("SET session_replication_role = 'replica';");

            await this._loadRecordsByModel_(entityName, data, ignoreDuplicate);
        } catch (error) {
            throw error;
        } finally {
            await this.db.connector.execute_("SET session_replication_role = 'origin';");
        }
    }

    async _loadRecordsByModel_(entityName, items, ignoreDuplicate) {
        const Entity = this.db.entity(entityName);

        return eachAsync_(items, async ({ $skipModifiers, $skipValidators, $update, $upsert, $ignore, $noLog, ...item }) => {
            const opts = { $getCreated: false, $migration: true, $skipModifiers, $skipValidators, $upsert, $ignore, $noLog };

            if ($update) {
                await Entity.updateOne_(item, undefined);
            } else {
                if (ignoreDuplicate) {
                    opts.$ignore = true;
                }

                const processed = await Entity.create_(item, opts);

                if (processed.affectedRows === 0) {
                    const key = Entity.getUniqueKeyValuePairsFrom(processed.data);
                    this.app.log('info', `Duplicate record ${JSON.stringify(key)} is ignored.`);
                }
            }
        });
    }
}

module.exports = PostgresMigration;
