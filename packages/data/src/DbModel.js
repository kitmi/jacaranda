import { naming } from '@kitmi/utils';

class DbModel {
    constructor(app, connector, transaction) {
        this.app = app;
        this.connector = connector;
        this.transaction = transaction;

        this._entities = {};
    }

    get paramToken() {
        return this.connector.specParamToken;
    }

    escapeId(id) {
        return this.connector.escapeId(id);
    }

    escapeValue(val) {
        return this.connector.escapeValue(val);
    }

    /**
     * Get the db model metadata, e.g. Entity classes.
     */
    get meta() {
        return this.constructor.meta;
    }

    /**
     * Get the schema name.
     */
    get schemaName() {
        return this.meta.schemaName;
    }

    /**
     * Get the driver.
     * @returns {string}
     */
    get driver() {
        return this.connector.driver;
    }

    /**
     * Fork the model with transaction flag.
     * @param {Client} transaction - Client created from beginTransaction_.
     * @returns {DbModel}
     */
    fork(transaction) {
        return new this.constructor(this.app, this.connector, transaction);
    }

    /**
     * Get an entity instance by entity name.
     * @param {string} entityName
     * @returns {EntityModel}
     */
    entity(entityName) {
        if (this._entities[entityName]) return this._entities[entityName];

        const modelClassName = naming.pascalCase(entityName);
        if (this._entities[modelClassName]) return this._entities[modelClassName];

        return (this._entities[modelClassName] = new this.meta.Entities[modelClassName](this));
    }

    /**
     * Run a transaction.
     * @param {*} action_
     * @param {*} connOptions
     * @param {*} maxRetry
     * @param {*} interval
     * @param {*} onRetry_
     */
    async transaction_(transactionFunc) {
        let db;

        try {
            db = this.fork(await this.connector.beginTransaction_());
            await transactionFunc(db);
            await db.connector.commit_(db.transaction);
        } catch (error) {            
            db && (await db.connector.rollback_(db.transaction, error));
            throw error;
        } finally {
            db.end();
        }
    }

    /**
     * End the model.
     */
    end() {
        delete this.transaction;
        delete this._entities;
        delete this.connector;
        delete this.app;
    }
}

export default DbModel;
