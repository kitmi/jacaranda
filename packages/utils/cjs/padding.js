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
    padLeft: function() {
        return padLeft;
    },
    padRight: function() {
        return padRight;
    }
});
const padLeft = (str, starting)=>starting ? starting + (str ?? '') : str;
const padRight = (str, ending)=>ending ? (str ?? '') + ending : str;

//# sourceMappingURL=padding.js.map