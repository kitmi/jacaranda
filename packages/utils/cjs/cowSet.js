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
const _clone = /*#__PURE__*/ _interop_require_default(require("lodash/clone"));
const _isInteger = /*#__PURE__*/ _interop_require_wildcard(require("./isInteger"));
const _set = require("./set");
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
// copy on write set
function cowSet(collection, keyPath, value, options) {
    options = {
        numberAsArrayIndex: true,
        keyPathSeparator: '.',
        ...options
    };
    if (collection == null || typeof collection !== 'object') {
        return collection;
    }
    if (keyPath == null) {
        return collection;
    }
    let nodes = Array.isArray(keyPath) ? keyPath.concat() : keyPath.split(options.keyPathSeparator);
    const length = nodes.length;
    if (length > 0) {
        const lastIndex = length - 1;
        let index = 0;
        let nested = (0, _clone.default)(collection);
        collection = nested;
        while(nested != null && index < lastIndex){
            const key = nodes[index++];
            let next = nested[key];
            if (next == null || typeof next !== 'object') {
                // peek next node, see if it is integer
                const nextKey = nodes[index];
                if (options.numberAsArrayIndex && (0, _isInteger.default)(nextKey, {
                    range: _isInteger.RANGE_INDEX
                })) {
                    next = (0, _set.addEntry)(nested, key, [], options.numberAsArrayIndex);
                } else {
                    next = (0, _set.addEntry)(nested, key, {}, options.numberAsArrayIndex);
                }
                nested = next;
            } else {
                nested[key] = (0, _clone.default)(next);
                nested = nested[key];
            }
        }
        const lastKey = nodes[lastIndex];
        (0, _set.addEntry)(nested, lastKey, value, options.numberAsArrayIndex);
    }
    return collection;
}
const _default = cowSet;

//# sourceMappingURL=cowSet.js.map