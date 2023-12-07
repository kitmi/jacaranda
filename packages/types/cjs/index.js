"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _types.default;
    }
});
const _types = /*#__PURE__*/ _interop_require_wildcard(_export_star(require("./types"), exports));
const _any = /*#__PURE__*/ _interop_require_default(require("./any"));
const _array = /*#__PURE__*/ _interop_require_default(require("./array"));
const _boolean = /*#__PURE__*/ _interop_require_default(require("./boolean"));
const _datetime = /*#__PURE__*/ _interop_require_default(require("./datetime"));
const _integer = /*#__PURE__*/ _interop_require_default(require("./integer"));
const _number = /*#__PURE__*/ _interop_require_default(require("./number"));
const _object = /*#__PURE__*/ _interop_require_default(require("./object"));
const _text = /*#__PURE__*/ _interop_require_default(require("./text"));
const _binary = /*#__PURE__*/ _interop_require_default(require("./binary"));
const _bigint = /*#__PURE__*/ _interop_require_default(require("./bigint"));
_export_star(require("./errors"), exports);
_export_star(require("./functions"), exports);
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
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
(0, _types.addType)('ANY', _any.default);
(0, _types.addType)('ARRAY', _array.default);
(0, _types.addType)('BOOLEAN', _boolean.default);
(0, _types.addType)('DATETIME', _datetime.default);
(0, _types.addType)('INTEGER', _integer.default);
(0, _types.addType)('NUMBER', _number.default);
(0, _types.addType)('OBJECT', _object.default);
(0, _types.addType)('TEXT', _text.default);
(0, _types.addType)('BINARY', _binary.default);
(0, _types.addType)('BIGINT', _bigint.default);

//# sourceMappingURL=index.js.map