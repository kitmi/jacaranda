"use strict";

const path = require('path');
const { _, eachAsync_, quote } = require('@genx/july');
const { fs } = require('@genx/sys');

/**
 * MySQL migration.
 * @class
 */
class MySQLMigration {
    /** 
     * @param {ServiceContainer} app    
     * @param {object} context
     * @param {Db} db
     */
    constructor(app, context, db) {
        this.app = app;        
        this.modelPath = context.modelPath;
        this.scriptPath = context.scriptPath;        
        this.db = db;

        this.dbScriptPath = path.join(this.scriptPath, this.db.driver, this.db.schemaName);
    }

    async reset_() {
        return this.db.connector.execute_(`DROP DATABASE IF EXISTS ??`, [ this.db.connector.database ], { createDatabase: true });
    }

    async create_(extraOptions) {        
        let sqlFiles = [ 'entities.sql', 'relations.sql', 'procedures.sql' ];

        let sqlCreate = 'CREATE DATABASE IF NOT EXISTS ??';

        if (extraOptions && !_.isEmpty(extraOptions.db)) {
            sqlCreate += ' ' + _.reduce(extraOptions.db, (r, v, k) => {
                return r + ' ' + _.upperCase(k) + ' ' + quote(v.toString(), '"');
            }, '');
        }
        
        let result = await this.db.connector.execute_(sqlCreate, 
            [ this.db.connector.database ], 
            { createDatabase: true }
        );
        
        if (result.warningStatus == 0) {
            this.app.log('info', `Created database "${this.db.connector.database}".`);
        } else {
            this.app.log('warn', `Database "${this.db.connector.database}" exists.`);
        }                        

        return eachAsync_(sqlFiles, async (file) => {
            let sqlFile = path.join(this.dbScriptPath, file);
            if (!fs.existsSync(sqlFile)) {
                throw new Error(`Database script "${sqlFile}" not found.`);
            }

            let sql = _.trim(fs.readFileSync(sqlFile, { encoding: 'utf8' }));
            if (sql) {
                result = _.castArray(await this.db.connector.execute_(sql, null, { multipleStatements: 1 }));

                let warningRows = _.reduce(result, (sum, row) => {
                    sum += row.warningStatus;
                    return sum;
                }, 0);

                if (warningRows > 0) {
                    this.app.log('warn', `${warningRows} warning(s) reported while running "${file}".`);
                } else {
                    this.app.log('info', `Database scripts "${sqlFile}" run successfully.`);
                }
            }
        });
    }

    async load_(dataFile, ignoreDuplicate) {
        let ext = path.extname(dataFile);
        this.app.log('verbose', `Loading data file "${dataFile}" ...`);

        if (ext === '.json') {
            let data = fs.readJsonSync(dataFile, {encoding: 'utf8'});

            if (Array.isArray(data)) {
                let entityName = path.basename(dataFile, ext);
                await this._loadSingleEntityRecords_(entityName, data, ignoreDuplicate);
            } else {
                await this._loadMultiEntityRecords_(data, ignoreDuplicate);
            }
            this.app.log('info', `Loaded JSON data file: ${dataFile}`);
        } else if (ext === '.sql') {
            let sql = fs.readFileSync(dataFile, {encoding: 'utf8'});
            let result = await this.db.connector.execute_(sql, null, { multipleStatements: 1 });
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
                
                worksheet.eachRow(function(row, rowNumber) {                   
                    
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
            let executor = require(dataFile);
            await executor(this.app, this.db.connector);

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

            const Entity = this.db.model(entityName);
            const data = await Entity.findAll_(exportConfig.dataset);

            _.forOwn(exportConfig.rules, (enabled, name) => {
                if (enabled) {
                    const processRule = require(`./rules/${name}.js`);
                    data.forEach(entity => processRule(this.db, Entity, entity));
                }                    
            });

            const baseFileName = `${dataFileName}.json`;
            items.push(baseFileName);

            const dataFile = path.join(outputDir, baseFileName);

            fs.writeJsonSync(dataFile, {
                [Entity.meta.name]: data
            }, { spaces: 4 });

            this.app.log('info', 'Generated entity data file: ' + dataFile);
        });

        if (!skipIndexFile) {
            this.writeIndexFile(outputDir, items);
        }
        
        return items;
    }

    async _loadMultiEntityRecords_(data, ignoreDuplicate) {        

        try {
            await this.db.connector.execute_('SET FOREIGN_KEY_CHECKS=0;');

            await eachAsync_(data, async (records, entityName) => {                
                let items = Array.isArray(records) ? records : [ records ];
                return this._loadRecordsByModel_(entityName, items, ignoreDuplicate);
            });
        } catch (error) {
            throw error;
        } finally {
            await this.db.connector.execute_('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    async _loadSingleEntityRecords_(entityName, data, ignoreDuplicate) {
        try {
            await this.db.connector.execute_('SET FOREIGN_KEY_CHECKS=0;');

            await this._loadRecordsByModel_(entityName, data, ignoreDuplicate);
        } catch (error) {
            throw error;
        } finally {
            await this.db.connector.execute_('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    async _loadRecordsByModel_(entityName, items, ignoreDuplicate) {
        const connOptions = {};
        if (ignoreDuplicate) {
            connOptions.insertIgnore = true;
        }

        const Entity = this.db.model(entityName);

        return eachAsync_(items, async ({ $skipModifiers, $update, ...item }) => {
            const opts = { $migration: true, $skipModifiers, $retrieveDbResult: true };

            if ($update) {
                await Entity.updateOne_(item, undefined, connOptions);
            } else {                
                const processed = await Entity.create_(item, opts, connOptions);
                if (opts.$result.affectedRows === 0) {
                    const key = Entity.getUniqueKeyValuePairsFrom(processed);
                    this.app.log('info', `Duplicate record ${JSON.stringify(key)} is ignored.`);
                }       
            }                 
        });  
    }
}

module.exports = MySQLMigration;