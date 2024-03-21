"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    PrismaModel: function() {
        return PrismaModel;
    },
    default: function() {
        return _default;
    }
});
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
class DbModel {
    async retryCreate_(createOptions, onDuplicate_, maxRetry) {
        maxRetry || (maxRetry = 99);
        let retry = 0;
        let error;
        while(retry++ < maxRetry){
            try {
                return await this.model.create(createOptions);
            } catch (err) {
                //P2002: Unique constraint failed
                if (err.code !== this.E_CODE_DUPLICATE) {
                    throw err;
                }
                createOptions = await onDuplicate_(createOptions);
                error = err;
            }
        }
        throw error;
    }
    async getCachedUnique_(key, query, ttl) {
        const cacheService = this.db._$env.cacheService;
        const cacheKey = `db:${this.name}:${key}`;
        return cacheService.get_(cacheKey, ()=>modelInstance.model.findUnique(query), ttl);
    }
    async getCachedMany_(key, findMany, ttl) {
        const cacheService = this.db._$env.cacheService;
        const cacheKey = `db:${this.name}:${key}`;
        return cacheService.get_(cacheKey, ()=>modelInstance.model.findMany(findMany), ttl);
    }
    constructor(ownerModule, db, name){
        this.db = db;
        this.ownerModule = ownerModule;
        this.name = name;
        this.model = db[this.name];
    }
}
class PrismaModel extends DbModel {
    constructor(...args){
        super(...args);
        _define_property(this, "E_CODE_DUPLICATE", 'P2002');
    }
}
const _default = DbModel;

//# sourceMappingURL=DbModel.js.map