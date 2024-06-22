import { ApplicationError } from '@kitmi/types';
import { _ } from '@kitmi/utils';

class BasicController {
    constructor(app) {
        /**
         * App module
         * @member {WebModule}
         */
        this.app = app;
        this.apiWrapper = this.app.getService(this.app.settings?.apiWrapperService || 'apiWrapper');

        if (!this.apiWrapper) {
            throw new ApplicationError('"apiWrapper" service is required when using the built-in Controller.');
        }
    }

    /**
     * Return a service by name
     * @param {string} serviceName 
     * @returns {object}
     */
    $(serviceName) {
        const service = this.app.getService(serviceName);
        if (!service) {
            throw new ApplicationError(`Service "${serviceName}" is enabled.`);
        }

        return service;
    }

    /**
     * Return a db model by name [ and schema ]
     * @param {*} name 
     * @param {*} [schema] 
     * @returns {EntityModel}
     */
    $m(name, schema) {
        if (this.app.db == null) {
            throw new ApplicationError('Database service (i.e. db feature) is not enabled.');
        }

        const db = this.app.db(schema);        
        return db.entity(name);
    }

    /**
     * Try to send back data from time-to-live cache
     * @param {*} ctx
     * @param {*} key
     * @returns {boolean}
     */
    trySendCache(ctx, key) {
        if (ctx.query['no-cache']) {
            return false;
        }

        const ttlCache = this.app.getService('ttlMemCache');
        if (!ttlCache) {
            throw new ApplicationError(
                '"ttlMemCache" service is required. Please check npm module "@kitmi/feat-utils/ttlMemCache".'
            );
        }

        const _cache = ttlCache.get(key);
        if (_cache) {
            this.send(ctx, ..._cache);
            return true;
        }
        return false;
    }

    /**
     * Delete a memory cache entry by key
     * @param {*} key 
     */
    deleteCache(key) {
        const ttlCache = this.app.getService('ttlMemCache');
        ttlCache.del(key);
    }

    /**
     * Send response with cache and wrapped by apiWrapper feature
     * @param {*} ctx 
     * @param {*} result 
     * @param {*} payload 
     * @param {*} ttlCacheInfo 
     */
    send(ctx, result, payload, ttlCacheInfo) {
        ctx.body = this.apiWrapper.wrapResult(ctx, result, payload);
        if (ttlCacheInfo) {
            const ttlCache = this.app.getService('ttlMemCache');
            const value = [result];
            if (payload) {
                value.push(payload);
            }

            if (!ttlCacheInfo.key)  {
                throw new ApplicationError('"key" of TTL cache is required.');
            }

            ttlCache.set(ttlCacheInfo.key, value, ttlCacheInfo.ttl);
        }
    }
}

export default BasicController;
