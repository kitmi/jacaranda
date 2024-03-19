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
const _jsonv = require("@kitmi/jsonv");
const _validatorsLoader = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonv/validatorsLoader"));
const _transformersLoader = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonv/transformersLoader"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const config = new _jsonv.Config();
(0, _validatorsLoader.default)(config);
(0, _transformersLoader.default)(config);
const _default = config;

//# sourceMappingURL=config.js.map