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
    formatKey: function() {
        return formatKey;
    },
    formatPath: function() {
        return formatPath;
    },
    makePath: function() {
        return makePath;
    },
    namingFactory: function() {
        return namingFactory;
    }
});
const namingFactory = (nameOfValue)=>(name, left, context, custom)=>{
        const fullName = name == null ? context.path : makePath(name, context?.path);
        return fullName == null ? nameOfValue(custom) : `"${context?.mapOfNames ? context.mapOfNames[fullName] : fullName}"`;
    };
const formatKey = (key, hasPrefix)=>Number.isInteger(key) ? `[${key}]` : hasPrefix ? '.' + key : key;
const makePath = (key, prefix)=>prefix != null ? `${prefix}${formatKey(key, true)}` : formatKey(key, false);
const formatPath = (prefix)=>prefix ? '[' + prefix + ']' : '<ROOT>';

//# sourceMappingURL=utils.js.map