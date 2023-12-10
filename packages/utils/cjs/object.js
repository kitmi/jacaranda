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
    cowSet: function() {
        return _cowSet.default;
    },
    defaultDeep: function() {
        return _defaultDeep.default;
    },
    diff: function() {
        return _diff.default;
    },
    filterNull: function() {
        return _filterNull.default;
    },
    flattenObject: function() {
        return _flattenObject.default;
    },
    get: function() {
        return _get.default;
    },
    hasMethod: function() {
        return _hasMethod.default;
    },
    keyAt: function() {
        return _keyAt.default;
    },
    objectToArray: function() {
        return _objectToArray.default;
    },
    pushIntoBucket: function() {
        return _pushIntoBucket.default;
    },
    remap: function() {
        return _remap.default;
    },
    set: function() {
        return _set.default;
    },
    take: function() {
        return _take.default;
    },
    unflattenObject: function() {
        return _unflattenObject.default;
    },
    xNull: function() {
        return _filterNull.default;
    }
});
const _remap = /*#__PURE__*/ _interop_require_default(require("./remap"));
const _diff = /*#__PURE__*/ _interop_require_default(require("./diff"));
const _take = /*#__PURE__*/ _interop_require_default(require("./take"));
const _pushIntoBucket = /*#__PURE__*/ _interop_require_default(require("./pushIntoBucket"));
const _get = /*#__PURE__*/ _interop_require_default(require("./get"));
const _set = /*#__PURE__*/ _interop_require_default(require("./set"));
const _cowSet = /*#__PURE__*/ _interop_require_default(require("./cowSet"));
const _objectToArray = /*#__PURE__*/ _interop_require_default(require("./objectToArray"));
const _flattenObject = /*#__PURE__*/ _interop_require_default(require("./flattenObject"));
const _unflattenObject = /*#__PURE__*/ _interop_require_default(require("./unflattenObject"));
const _filterNull = /*#__PURE__*/ _interop_require_default(require("./filterNull"));
const _defaultDeep = /*#__PURE__*/ _interop_require_default(require("./defaultDeep"));
const _hasMethod = /*#__PURE__*/ _interop_require_default(require("./hasMethod"));
const _keyAt = /*#__PURE__*/ _interop_require_default(require("./keyAt"));
_export_star(require("./objectPathUtils"), exports);
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

//# sourceMappingURL=object.js.map