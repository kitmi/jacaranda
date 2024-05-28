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
        '@napi-rs/uuid'
    ],
    load_: async function(app, options, name) {
        const { v4 } = await app.tryRequire_('@napi-rs/uuid');
        const service = {
            next: v4
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=uuid.js.map