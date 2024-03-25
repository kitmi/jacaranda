"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return fileInfo;
    }
});
const _sys = require("@kitmi/sys");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _mime = /*#__PURE__*/ _interop_require_default(require("mime"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function fileInfo(step, settings) {
    if (!settings.file) {
        throw new Error('Missing file setting.');
    }
    const filePath = step.getValue(settings.file);
    const stat = await _sys.fs.stat(filePath);
    const ext = _nodepath.default.extname(filePath);
    const result = {
        baseName: _nodepath.default.basename(filePath, ext),
        extName: ext,
        fileName: baseName + ext,
        size: stat.size,
        mime: _mime.default.getType(ext)
    };
    step.stepLog('info', `File info for "${filePath}".`, {
        result
    });
    return result;
}

//# sourceMappingURL=fileInfo.js.map