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
    prefixKeys: function() {
        return prefixKeys;
    },
    suffixKeys: function() {
        return suffixKeys;
    }
});
function prefixKeys(obj, prefix) {
    return Object.keys(obj).reduce((acc, key)=>{
        acc[prefix + key] = obj[key];
        return acc;
    }, {});
}
function suffixKeys(obj, suffix) {
    return Object.keys(obj).reduce((acc, key)=>{
        acc[key + suffix] = obj[key];
        return acc;
    }, {});
}

//# sourceMappingURL=objectKeyUtils.js.map