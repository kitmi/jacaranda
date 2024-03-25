"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return pathResolve;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function pathResolve(step, settings) {
    const { path: _path, base } = settings;
    const _base = step.getValue(base);
    return _nodepath.default.resolve(_base, step.getValue(_path));
}

//# sourceMappingURL=pathResolve.js.map