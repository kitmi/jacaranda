/**
 * Enable passport feature
 * @module Feature_Passport
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
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
    packages: [
        'koa-passport',
        'passport'
    ],
    /**
     * Load the feature
     * @param {Routable} app - The app module object
     * @param {object} config - Passport settings
     * @property {bool} [config.useSession=false] - Use session or not, default: false
     *
     * @property {object} config.init - Passport initialization settings
     * @property {string} [config.init.userProperty='user'] - User property name, default: user
     *
     * @property {array} config.strategies - Passport strategies, e.g. [ 'local', 'facebook' ]
     * @property {array} config.shareToServer - Expose the passport servcie to while server
     * @returns {Promise.<*>}
     */ load_: function(app, options, name) {
        const { strategies, useSession, init, shareToServer } = app.featureConfig(options, {
            schema: {
                strategies: {
                    type: 'array',
                    element: {
                        type: 'text'
                    }
                },
                useSession: {
                    type: 'bool',
                    default: false
                },
                init: {
                    type: 'object',
                    optional: true
                },
                shareToServer: {
                    type: 'bool',
                    default: false
                }
            }
        }, name);
        const KoaPassport = app.tryRequire('koa-passport').KoaPassport;
        const passport = new KoaPassport();
        let initializeMiddleware = passport.initialize(init);
        passport.middlewares = useSession ? [
            initializeMiddleware,
            passport.session()
        ] : initializeMiddleware;
        app.on('before:' + _Feature.default.FINAL, async ()=>{
            await app.useMiddlewares_(app.router, passport.middlewares);
        });
        passport.hasStrategy = (name)=>{
            return name in passport._strategies;
        };
        app.registerService(name, passport);
        if (shareToServer && app.host != null) {
            app.host.registerService(name, passport);
        }
        return (0, _utils.batchAsync_)(strategies, async (strategy)=>{
            const strategyScript = _nodepath.default.join(app.sourcePath, 'passports', strategy);
            const strategyInitiator = (0, _utils.esmCheck)(require(strategyScript));
            return strategyInitiator(app, passport);
        });
    }
};

//# sourceMappingURL=passport.js.map