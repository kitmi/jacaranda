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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../../jacaranda/src/Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'cld'
    ],
    load_: async function(app, options, name) {
        const cld = await app.tryRequire_('cld');
        const service = {
            detect_: async (text)=>{
                const { reliable, languages } = await cld.detect(text);
                return {
                    reliable,
                    name: languages[0]?.name ?? 'unknown',
                    code: languages[0]?.code ?? 'unknown'
                };
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=aiLocaleDetection.js.map