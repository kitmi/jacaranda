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
const _allSync = require("@kitmi/validators/allSync");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _mime = /*#__PURE__*/ _interop_require_default(require("mime"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function fileInfo(step, settings) {
    let { file } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            file: {
                type: 'text'
            }
        }
    });
    const filePath = step.getValue(file);
    const stat = await _sys.fs.stat(filePath);
    const ext = _nodepath.default.extname(filePath);
    const baseName = _nodepath.default.basename(filePath, ext);
    const result = {
        baseName,
        extName: ext,
        fileName: baseName + ext,
        size: stat.size,
        mime: _mime.default.getType(ext)
    };
    step.syslog('info', `File info attained for "${filePath}".`, {
        result
    });
    return result;
}

//# sourceMappingURL=fileInfo.js.map