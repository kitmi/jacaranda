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
const _allSync = require("@kitmi/validators/allSync");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function pathResolve(step, settings) {
    let { path: _path, base } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            path: {
                type: 'text'
            },
            base: {
                type: 'text'
            }
        }
    });
    const _base = step.getValue(base);
    const result = _nodepath.default.resolve(_base, step.getValue(_path));
    step.syslog('info', `Resolved path: ${result}`, {
        result
    });
    return result;
}

//# sourceMappingURL=pathResolve.js.map