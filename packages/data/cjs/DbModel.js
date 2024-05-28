"use strict";
const path = require('node:path');
const { createRequire } = require('node:module');
const { _, naming, sleep_, text } = require('@genx/july');
const { fs } = require('@genx/sys');
const { InvalidArgument } = require('@genx/error');
const retryFailed = (error)=>[
        false,
        error
    ];
const retryOK = (result)=>[
        true,
        result
    ];
const directReturn = (a)=>a;
const tryRequire = (ownerApp, modulePath)=>{
    try {
        const requireLocal = createRequire(text.ensureEndsWith(ownerApp.workingPath, path.sep));
        return requireLocal(modulePath);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return undefined;
        }
        throw error;
    }
};
class DbModel {
    get driver() {
        return this.connector.driver;
    }
    /**
     * Get entity model class by entity name.
     * @param {*} entityName
     */ model(entityName) {
        if (!entityName) {
            throw new InvalidArgument('Entity name is required.');
        }
        if (this._modelCache[entityName]) return this._modelCache[entityName];
        const modelClassName = naming.pascalCase(entityName);
        if (this._modelCache[modelClassName]) return this._modelCache[modelClassName];
        const entityCustomClassFactory = this.loadCustomModel(modelClassName);
        const entityClassFactory = this.loadModel(modelClassName);
        let modelClass = require(`./drivers/${this.driver}/EntityModel`);
        modelClass = entityClassFactory(modelClass);
        if (modelClass.meta.packagePath) {
            const entityClassFromPackage = this.loadPackageModel(modelClass.meta.packagePath, modelClassName);
            if (entityClassFromPackage) {
                modelClass = entityClassFromPackage(modelClass);
            }
        }
        if (entityCustomClassFactory) {
            modelClass = entityCustomClassFactory(modelClass);
        }
        modelClass.db = this;
        if (modelClass.__init) {
            modelClass.__init();
        }
        this._modelCache[entityName] = modelClass;
        if (modelClassName !== entityName) {
            this._modelCache[modelClassName] = modelClass;
        }
        return modelClass;
    }
    loadPackageModel(packagePath, modelClassName) {
        const packageModelPath = path.join(packagePath, process.env.NODE_RT && process.env.NODE_RT === 'babel' ? 'src' : 'lib', 'models', `${modelClassName}.js`);
        const customModelPath = this.ownerApp.toAbsolutePath(packageModelPath);
        return fs.existsSync(customModelPath) ? require(customModelPath) : tryRequire(this.ownerApp, packageModelPath);
    }
    entitiesOfType(baseEntityName) {
        return _.filter(this.entities, (entityName)=>{
            const Model = this.model(entityName);
            return Model.baseClasses && Model.baseClasses.indexOf(baseEntityName) > -1;
        });
    }
    /**
     * Run an action and automatically retry when failed.
     * @param {*} transactionName
     * @param {*} action_
     * @param {*} connOptions
     * @param {*} maxRetry
     * @param {*} interval
     * @param {*} onRetry_
     */ async retry_(transactionName, action_, connOptions, maxRetry, interval, onRetry_) {
        // retry will be ignored, if the transaction is a part of another transaction
        if (connOptions && connOptions.connection) {
            return action_(directReturn, directReturn);
        }
        let i = 0;
        if (maxRetry == null) maxRetry = 2;
        while(i++ < maxRetry){
            const [finished, result] = await action_(retryOK, retryFailed);
            if (finished) {
                return result;
            }
            if (i === maxRetry) {
                throw result;
            }
            this.app.logException('warn', result, `Unable to complete "${transactionName}" and will try ${maxRetry - i} more times after ${interval || 0} ms.`);
            if (interval != null) {
                await sleep_(interval);
            }
            if (onRetry_) {
                await onRetry_();
            }
        }
    }
    /**
     * Run an action as transaction and automatically retry when failed.
     * @param {*} transactionName
     * @param {*} action_
     * @param {*} connOptions
     * @param {*} maxRetry
     * @param {*} interval
     * @param {*} onRetry_
     */ async safeRetry_(transactionName, action_, connOptions, maxRetry, interval, onRetry_) {
        return this.retry_(transactionName, (ok, failed)=>this.doTransaction_(async (connOpts)=>ok(await action_(connOpts)), failed, connOptions), connOptions, maxRetry, interval, onRetry_);
    }
    async close_() {
        delete this._modelCache;
        delete this.connector;
        delete this.app;
        delete this.ownerApp;
    }
    constructor(app, connector, i18n){
        this.ownerApp = app;
        this.app = app;
        this.connector = connector;
        this.i18n = i18n;
        this._modelCache = {};
    }
}
module.exports = DbModel;

//# sourceMappingURL=DbModel.js.map