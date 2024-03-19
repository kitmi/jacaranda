"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _index.default;
    }
});
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _localesLoader = /*#__PURE__*/ _interop_require_default(require("./localesLoader"));
const _index = /*#__PURE__*/ _interop_require_default(_export_star(require("./index"), exports));
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
(0, _localesLoader.default)(_config.default);

//# sourceMappingURL=bundle.js.map