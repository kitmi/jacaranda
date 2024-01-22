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
    addEntry: function() {
        return addEntry;
    },
    default: function() {
        return _default;
    }
});
const _isPlainObject = /*#__PURE__*/ _interop_require_default(require("./isPlainObject"));
const _each = /*#__PURE__*/ _interop_require_default(require("lodash/each"));
const _isInteger = /*#__PURE__*/ _interop_require_wildcard(require("./isInteger"));
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
const addEntry = (obj, key, value, numberAsArrayIndex)=>{
    if (numberAsArrayIndex && (0, _isInteger.default)(key, {
        range: _isInteger.RANGE_INDEX
    })) {
        if (Array.isArray(obj)) {
            const index = parseInt(key, 10);
            if (obj.length <= index) {
                const numToFill = index - obj.length;
                if (numToFill > 0) {
                    for(let i = 0; i < numToFill; i++){
                        obj.push(undefined);
                    }
                }
                obj.push(value);
            } else {
                obj[index] = value;
            }
            return obj[index];
        }
    }
    obj[key] = value;
    return obj[key];
};
/**
 * Set a value by dot-separated path or key array into a collection
 * Does not support '[i]', e.g. 'a[0].b.c' style accessor, use [ 'a',  0, 'b', 'c' ] instead, different from lodash/set
 * @alias  object.set
 * @param {Object} collection - The collection
 * @param {string} keyPath - A dot-separated path (dsp) or a key array, e.g. settings.xxx.yyy, or ['setting', 'xxx', 'yyy']
 * @param {Object} value - The default value if the path does not exist
 * @returns {*}
 */ const _set = (collection, keyPath, value, options)=>{
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
    if ((0, _isPlainObject.default)(keyPath) && typeof value === 'undefined') {
        // extract all key value pair and set
        (0, _each.default)(keyPath, (v, k)=>_set(collection, k, v, options));
        return collection;
    }
    // break the path into nodes array
    let nodes = Array.isArray(keyPath) ? keyPath.concat() : keyPath.split(options.keyPathSeparator);
    const length = nodes.length;
    if (length > 0) {
        const lastIndex = length - 1;
        let index = 0;
        let nested = collection;
        while(nested != null && index < lastIndex){
            const key = nodes[index++];
            let next = nested[key];
            if (next == null || typeof next !== 'object') {
                // peek next node, see if it is integer
                const nextKey = nodes[index];
                if (options.numberAsArrayIndex && (0, _isInteger.default)(nextKey, {
                    range: _isInteger.RANGE_INDEX
                })) {
                    next = addEntry(nested, key, [], options.numberAsArrayIndex);
                } else {
                    next = addEntry(nested, key, {}, options.numberAsArrayIndex);
                }
            }
            nested = next;
        }
        const lastKey = nodes[lastIndex];
        addEntry(nested, lastKey, value, options.numberAsArrayIndex);
    }
    return collection;
};
const _default = _set;

//# sourceMappingURL=set.js.map