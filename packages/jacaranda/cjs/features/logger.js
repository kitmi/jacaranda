/**
 * Enable multi-categories logging by pino logger
 * @module Feature_Logger
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /*
 logger: {
     transport: {
        target: '/absolute/path/to/my-transport.mjs'
     }
 }

 logger: {
    transport: {
    targets: [
      { target: '/absolute/path/to/my-transport.mjs', level: 'error' },
      { target: 'some-file-transport', options: { destination: '/dev/null' }
    ]
 }    
*/ "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */ stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'pino',
        'pino-pretty'
    ],
    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} categories - Configuration for multi-categories
     * @returns {Promise.<*>}
     * @example
     *
     *  let logger = app.getService('logger');
     *  logger.log('error', 'error');
     *
     *  // with serviceGroup
     *  let logger1 = app.getService('logger-category1');
     */ load_: function(app, config, name) {
        const pino = app.requireModule('pino');
        config = app.featureConfig(config ?? {}, {
            schema: {
                transport: {
                    type: 'object',
                    optional: true
                }
            }
        }, name);
        const options = {
            nestedKey: 'payload',
            transport: {
                target: 'pino-pretty',
                options: {
                    levelFirst: true,
                    colorize: true,
                    ignore: "time,hostname,pid"
                }
            },
            ...config
        };
        const names = name.split('.', 2);
        let isAppLogger = true;
        if (names.length > 1) {
            options.name = names[1];
            isAppLogger = false;
        }
        const logger = pino({
            level: app.options.logLevel === 'verbose' ? 'debug' : app.options.logLevel,
            ...options
        });
        logger.verbose = logger.debug.bind(logger);
        logger.log = (level, message, info)=>logger[level](info, message);
        if (isAppLogger) {
            if (app._logCache.length > 0) {
                app._logCache.forEach(([level, message, obj])=>logger[level](obj, message));
                app._logCache.length = 0;
            }
            const makeLogger = (logger)=>({
                    log: (level, message, info)=>logger[level](info, message),
                    child: (arg1, arg2)=>{
                        const _logger = logger.child(arg1, arg2?.level ? {
                            ...arg2,
                            level: arg2.level === 'verbose' ? 'debug' : arg2.level
                        } : arg2);
                        _logger.verbose = _logger.debug.bind(_logger);
                        return makeLogger(_logger);
                    }
                });
            app.logger = makeLogger(logger);
            app.log = app._loggerLog;
        }
        app.registerService(name, logger);
    }
};

//# sourceMappingURL=logger.js.map