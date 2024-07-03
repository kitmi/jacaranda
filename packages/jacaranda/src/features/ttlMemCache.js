import Feature from '../Feature';

/**
 * Time-to-live (TTL) Memory Cache
 * @module Feature_TtlMemCache
 */

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['node-cache'],

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {number} [options.stdTTL=0] - The standard ttl as number in seconds for every generated cache element. 0 = unlimited
     * @property {number} [options.checkperiod=600] - The period in seconds, as a number, used for the automatic delete check interval. 0 = no periodic check.
     * @property {boolean} [options.useClones=false] - En/disable cloning of variables. If true you'll get a copy of the cached variable. If false you'll save and get just the reference.
     * @returns {Promise.<*>}
     *
     * @see[methods]{@link https://github.com/node-cache/node-cache}
     *
     */
    load_: async function (app, options, name) {
        const NodeCache = await app.tryRequire_('node-cache', true);
        const nodeCache = new NodeCache({
            useClones: false,
            ...options,
        });

        nodeCache.get_ = async (key, getter, ttl) => {
            const value = nodeCache.get(key);

            if (value !== undefined) {
                return value;
            }

            const newValue = await getter();

            nodeCache.set(key, newValue, ttl);

            return newValue;
        };

        app.registerService(name, nodeCache);
    },
};
