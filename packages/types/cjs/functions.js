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
    everTrue: function() {
        return everTrue;
    },
    identity: function() {
        return identity;
    },
    toggle: function() {
        return toggle;
    },
    typeOf: function() {
        return typeOf;
    }
});
const everTrue = ()=>true;
const identity = (value)=>value;
const toggle = (value)=>!value;
const typeOf = (value)=>{
    if (value == null) return 'any';
    const _type = typeof value;
    if (_type === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }
    if (_type === 'object') {
        if (Array.isArray(value)) {
            return 'array';
        }
        if (value instanceof Date) {
            return 'datetime';
        }
        if (value instanceof Buffer) {
            return 'binary';
        }
    }
    return _type;
};

//# sourceMappingURL=functions.js.map