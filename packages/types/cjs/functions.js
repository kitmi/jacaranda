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
    }
});
const everTrue = ()=>true;
const identity = (value)=>value;
const toggle = (value)=>!value;

//# sourceMappingURL=functions.js.map