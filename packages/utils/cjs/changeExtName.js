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
const _baseName = /*#__PURE__*/ _interop_require_default(require("./baseName"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const changeExtName = (str, newExtName, includePath)=>{
    return (0, _baseName.default)(str, includePath) + '.' + newExtName;
};
const _default = changeExtName;

//# sourceMappingURL=changeExtName.js.map