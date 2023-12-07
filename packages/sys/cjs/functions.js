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
    consoleError: function() {
        return consoleError;
    },
    consoleLog: function() {
        return consoleLog;
    }
});
const consoleLog = (data)=>console.log(data.toString());
const consoleError = (data)=>console.error(data.toString());

//# sourceMappingURL=functions.js.map