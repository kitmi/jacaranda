/**
 * Feature loading stage
 */
const Feature = {
    /**
     * Configuration, for loading config or overriding config
     */
    CONF: 'Config',
    /**
     * Initialization, e.g. settings
     */
    INIT: 'Initial',
    /**
     * Services, e.g. loggers, i18n
     */
    SERVICE: 'Services',
    /**
     * Loading plugins, e.g. middlewares, bootstrap
     */
    PLUGIN: 'Plugins',
    /**
     * Final preparation before service container get into work
     */
    FINAL: 'Final',

    /**
     * Validate a feature object.
     * @param {object} featureObject - Feature object
     * @property {string} featureObject.type - Feature loading stage
     * @property {function} featureObject.load_ - Feature loading method
     * @returns {bool}
     */
    validate(featureObject) {
        return featureObject && featureObject.hasOwnProperty('stage') && typeof featureObject.load_ === 'function';
    },
};

export default Feature;
