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
const _fileURLToPath = /*#__PURE__*/ _interop_require_default(require("./fileURLToPath"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function esmIsMain() {
    if (require("url").pathToFileURL(__filename).toString().startsWith('file:')) {
        // (A)
        const modulePath = (0, _fileURLToPath.default)(require("url").pathToFileURL(__filename).toString());
        if (process.argv[1] === modulePath) {
            // (B)
            return true;
        }
    }
    return false;
}
const _default = esmIsMain;

//# sourceMappingURL=esmIsMain.js.map