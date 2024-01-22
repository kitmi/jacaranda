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
    trim: function() {
        return trim;
    },
    trimLeft: function() {
        return trimLeft;
    },
    trimRight: function() {
        return trimRight;
    }
});
const trimLeft = (str, char = ' ')=>{
    let l = str.length;
    let i = 0;
    for(; i < l; i++){
        if (str[i] !== char) break;
    }
    return i > 0 ? str.substring(i) : str;
};
const trimRight = (str, char = ' ')=>{
    let l = str.length - 1;
    let i = l;
    for(; i > 0; i--){
        if (str[i] !== char) break;
    }
    return i < l ? str.substring(0, i + 1) : str;
};
const trim = (str, char = ' ')=>{
    return trimRight(trimLeft(str, char), char);
};

//# sourceMappingURL=trim.js.map