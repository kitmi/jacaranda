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
const _jacaranda = require("@kitmi/jacaranda");
const _Pipeline = /*#__PURE__*/ _interop_require_wildcard(require("./Pipeline"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const _default = {
    stage: _jacaranda.Feature.PLUGIN,
    groupable: true,
    packages: [
        'mime'
    ],
    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {string} options.taskProvider - Task provider.
     * @property {object} options.stepLogger - Logger used during step.
     * @returns {Promise.<*>}
     *
     * @example
     *
     * provider: 'digitalocean',
     * options: {
     *
     * }
     */ load_: async function(app, options, name) {
        let { taskProvider, stepLogger } = app.featureConfig(options, {
            schema: {
                taskProvider: {
                    type: 'text'
                },
                stepLogger: {
                    type: 'text',
                    optional: true,
                    default: "logger"
                }
            }
        }, name);
        app.requireServices([
            taskProvider,
            stepLogger
        ]);
        const service = {
            create (name, steps, env) {
                const _steps = (0, _Pipeline.normalizeSteps)(steps);
                return async (input, variables)=>{
                    const pipeline = new _Pipeline.default(app, name, _steps, {
                        env,
                        taskProvider,
                        stepLogger
                    });
                    if (variables) {
                        pipeline.setVariables(variables);
                    }
                    return [
                        pipeline,
                        await pipeline.run_(input)
                    ];
                };
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=index.js.map