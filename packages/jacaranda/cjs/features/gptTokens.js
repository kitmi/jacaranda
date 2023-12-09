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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'gpt-tokens'
    ],
    load_: async function(app, options, name) {
        const { GPTTokens } = await app.tryRequire_('gpt-tokens');
        const { model } = app.featureConfig(options, {
            schema: {
                model: {
                    type: 'text',
                    default: 'gpt-3.5-turbo'
                }
            }
        }, name);
        const service = {
            getUsedTokens: (messages)=>{
                const usageInfo = new GPTTokens({
                    model,
                    messages
                });
                return usageInfo.usedTokens;
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=gptTokens.js.map