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
const baseName = (str, includePath)=>{
    const pos = str.lastIndexOf('.');
    let pathname = pos === -1 ? str : str.substring(0, pos);
    if (includePath) {
        return pathname;
    }
    pathname = pathname.replace(/\\/g, '/');
    return pathname.substring(pathname.lastIndexOf('/') + 1);
};
const _default = baseName;

//# sourceMappingURL=baseName.js.map