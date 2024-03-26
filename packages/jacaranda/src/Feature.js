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
        return (
            featureObject &&
            typeof featureObject === 'object' &&
            (featureObject.stage == null || Stages.includes(featureObject.stage)) &&
            typeof featureObject.load_ === 'function' &&
            (featureObject.packages == null ||
                Array.isArray(featureObject.packages) ||
                typeof featureObject.packages === 'function') &&
            (featureObject.depends == null || Array.isArray(featureObject.depends)) &&
            (featureObject.level == null ||
                (Array.isArray(featureObject.level) && featureObject.level.every((l) => Levels.includes(l))))
        );
    },
};

const Levels = ['general', 'web', 'app', 'server'];

const Stages = [Feature.CONF, Feature.INIT, Feature.SERVICE, Feature.PLUGIN, Feature.FINAL];

export default Feature;
