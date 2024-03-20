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
    },
    readFileList_: function() {
        return readFileList_;
    }
});
const _fsextra = /*#__PURE__*/ _interop_require_default(require("fs-extra"));
const _nodeos = /*#__PURE__*/ _interop_require_default(require("node:os"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
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
const readFileList_ = async (basePath, listFile, eol)=>{
    const fileList = await _fsextra.default.readFile(listFile, 'utf-8');
    const list = fileList.split(eol ?? _nodeos.default.EOL);
    return list.reduce((acc, file)=>{
        if (file.startsWith('#')) {
            return acc;
        }
        file = file.trim();
        if (file.length === 0) {
            return acc;
        }
        return [
            ...acc,
            _nodepath.default.resolve(basePath, file)
        ];
    }, []);
};

//# sourceMappingURL=fsUtils.js.map