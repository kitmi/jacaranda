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
const _npm = /*#__PURE__*/ _interop_require_default(require("./npm"));
const _bun = /*#__PURE__*/ _interop_require_default(require("./bun"));
const _pnpm = /*#__PURE__*/ _interop_require_default(require("./pnpm"));
const _yarn = /*#__PURE__*/ _interop_require_default(require("./yarn"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const managers = {
    npm: _npm.default,
    bun: _bun.default,
    pnpm: _pnpm.default,
    yarn: _yarn.default
};
const _default = managers;

//# sourceMappingURL=index.js.map