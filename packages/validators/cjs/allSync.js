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
const _validator = /*#__PURE__*/ _interop_require_default(_export_star(require("./validator"), exports));
const _injectAll = /*#__PURE__*/ _interop_require_default(require("./injectAll"));
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
(0, _injectAll.default)(_validator.default);
const _default = _validator.default;

//# sourceMappingURL=allSync.js.map