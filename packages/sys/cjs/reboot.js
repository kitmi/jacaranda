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
const _nodechild_process = /*#__PURE__*/ _interop_require_default(require("node:child_process"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Restart the current process.
 * @param {Object} envVariables - Environment variables
 */ const reboot = (envVariables)=>{
    let processOptions = {
        env: {
            ...process.env,
            ...envVariables
        },
        detached: true,
        stdio: 'ignore'
    };
    let cp = _nodechild_process.default.spawn(process.argv[0], process.argv.slice(1), processOptions);
    cp.unref();
    process.exit(0);
};
const _default = reboot;

//# sourceMappingURL=reboot.js.map