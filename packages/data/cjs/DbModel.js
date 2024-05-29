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
class DbModel {
    /**
     * Fork the model with transaction flag.
     * @param {bool} transaction 
     * @returns {DbModel}
     */ fork(transaction) {
        return new this.constructor(this.app, this.connector, transaction ?? true);
    }
    /**
     * Get the driver.
     * @returns {string}
     */ get driver() {
        return this.connector.driver;
    }
    /**
     * Get an entity instance by entity name.
     * @param {string} entityName
     * @returns {EntityModel}
     */ entity(entityName) {
        if (this._entities[entityName]) return this._entities[entityName];
        const modelClassName = _utils.naming.pascalCase(entityName);
        if (this._entities[modelClassName]) return this._entities[modelClassName];
        return this._entities[modelClassName] = new this.constructor.meta.Entities[modelClassName](this);
    }
    /**
     * Run a transaction.
     * @param {*} action_
     * @param {*} connOptions
     * @param {*} maxRetry
     * @param {*} interval
     * @param {*} onRetry_
     */ async transaction_(transactionFunc) {
        const db = this.fork(true);
        try {
            await db.connector.beginTransaction_();
            await transactionFunc(db);
            await db.connector.commit_();
        } catch (error) {
            await db.connector.rollback_();
            throw error;
        } finally{
            db.end();
        }
    }
    /**
     * End the model.
     */ end() {
        delete this._entities;
        delete this.connector;
        delete this.app;
    }
    constructor(app, connector, transaction = false){
        this.app = app;
        this.connector = connector;
        this.transaction = transaction;
        this._meta = this.constructor.meta;
        this._entities = {};
    }
}
const _default = DbModel;

//# sourceMappingURL=DbModel.js.map