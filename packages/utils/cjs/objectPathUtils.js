"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    makePath: function() {
        return makePath;
    },
    makePathArray: function() {
        return makePathArray;
    },
    toPath: function() {
        return toPath;
    },
    toPathArray: function() {
        return toPathArray;
    }
});
const _ensureEndsWith = /*#__PURE__*/ _interop_require_default(require("./ensureEndsWith"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const toPathArray = (p, keyPathSeparator = '.')=>p == null ? [] : typeof p === 'string' ? p.split(keyPathSeparator) : Array.isArray(p) ? p : [
        p
    ];
const makePathArray = (part1, part2, keyPathSeparator = '.')=>[
        ...toPathArray(part1, keyPathSeparator),
        ...toPathArray(part2, keyPathSeparator)
    ];
const toPath = (p, keyPathSeparator = '.')=>p == null ? null : Array.isArray(p) ? p.join(keyPathSeparator) : p.toString();
const makePath = (part1, part2, keyPathSeparator = '.')=>{
    const path1 = toPath(part1, keyPathSeparator);
    const path2 = toPath(part2, keyPathSeparator);
    return path1 ? path2 ? (0, _ensureEndsWith.default)(path1, keyPathSeparator) + path2 : path1 : path2;
};

//# sourceMappingURL=objectPathUtils.js.map