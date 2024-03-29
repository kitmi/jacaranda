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
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
class BasicController {
    /**
     * Return a service by name
     * @param {string} serviceName 
     * @returns 
     */ $(serviceName) {
        const service = this.app.getService(serviceName);
        if (!service) {
            throw new _types.ApplicationError(`Service "${serviceName}" is enabled.`);
        }
        return service;
    }
    $m(name, schema) {
        const service = this.modelsService[schema ?? this.defaultSchema];
        return service.$model(name);
    }
    /**
     * Try to send back data from time-to-live cache
     * @param {*} ctx
     * @param {*} key
     * @returns {boolean}
     */ trySendCache(ctx, key) {
        if (ctx.query['no-cache']) {
            return false;
        }
        const ttlCache = this.app.getService('ttlMemCache');
        if (!ttlCache) {
            throw new _types.ApplicationError('"ttlMemCache" service is required. Please check npm module "@kitmi/feat-utils/ttlMemCache".');
        }
        const _cache = ttlCache.get(key);
        if (_cache) {
            this.send(ctx, ..._cache);
            return true;
        }
        return false;
    }
    deleteCache(key) {
        const ttlCache = this.app.getService('ttlMemCache');
        ttlCache.del(key);
    }
    send(ctx, result, payload, ttlCacheInfo) {
        ctx.body = this.apiWrapper.wrapResult(ctx, result, payload);
        if (ttlCacheInfo) {
            const ttlCache = this.app.getService('ttlMemCache');
            const value = [
                result
            ];
            if (payload) {
                value.push(payload);
            }
            if (!ttlCacheInfo.key) {
                throw new _types.ApplicationError('"key" of TTL cache is required.');
            }
            ttlCache.set(ttlCacheInfo.key, value, ttlCacheInfo.ttl);
        }
    }
    constructor(app){
        this.app = app;
        this.apiWrapper = this.app.getService(this.app.settings?.apiWrapperService || 'apiWrapper');
        if (!this.apiWrapper) {
            throw new _types.ApplicationError('"apiWrapper" service is required when using the built-in Controller.');
        }
        if (this.app.settings?.models) {
            // init models service
            this.modelsService = _utils._.mapValues(this.app.settings.models, ({ lib, driver }, schema)=>{
                if (this.defaultSchema == null) {
                    this.defaultSchema = schema;
                }
                const modelsModule = lib ? this.app.host.getLib(lib) : this.app;
                const service = modelsModule.getService(driver);
                if (service == null) {
                    throw new _types.ApplicationError(`Model driver "${driver}" not found in ${lib ? 'lib' : 'app module'} "${lib ?? this.app.name}"`);
                }
                return service;
            });
        }
    }
}
const _default = BasicController;

//# sourceMappingURL=Controller.js.map