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
    isDir: function() {
        return isDir;
    },
    isDirEmpty: function() {
        return isDirEmpty;
    },
    isDirEmpty_: function() {
        return isDirEmpty_;
    },
    isDir_: function() {
        return isDir_;
    }
});
const _fsextra = /*#__PURE__*/ _interop_require_default(require("fs-extra"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const isDir = (path)=>_fsextra.default.statSync(path).isDirectory();
const isDir_ = async (path)=>(await _fsextra.default.stat(path)).isDirectory();
const isDirEmpty = (path)=>_fsextra.default.readdirSync(path).length === 0;
const isDirEmpty_ = async (path)=>{
    const files = await _fsextra.default.readdir(path);
    return files.length === 0;
};

//# sourceMappingURL=fsUtils.js.map