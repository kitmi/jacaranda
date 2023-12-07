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
    runLive_: function() {
        return runLive_;
    },
    runSync: function() {
        return runSync;
    },
    run_: function() {
        return run_;
    }
});
const _nodechild_process = /*#__PURE__*/ _interop_require_default(require("node:child_process"));
const _functions = require("./functions");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const run_ = (cmd, options)=>new Promise((resolve, reject)=>_nodechild_process.default.exec(cmd, {
            windowsHide: true,
            ...options
        }, (error, stdout, stderr)=>{
            if (error) {
                return reject(error);
            }
            return resolve({
                stdout,
                stderr
            });
        }));
const runLive_ = (cmd, args, onStdOut, onStdErr, options)=>new Promise((resolve, reject)=>{
        let ps = _nodechild_process.default.spawn(cmd, args, {
            windowsHide: true,
            ...options
        });
        let e;
        onStdOut ??= _functions.consoleLog;
        onStdErr ??= _functions.consoleError;
        ps.stdout.on('data', onStdOut);
        ps.stderr.on('data', onStdErr);
        ps.on('close', (code)=>e ? reject(e) : resolve(code));
        ps.on('error', (error)=>{
            e = error;
        });
    });
const runSync = (cmd, options)=>_nodechild_process.default.execSync(cmd, {
        windowsHide: true,
        ...options
    }).toString();

//# sourceMappingURL=cmd.js.map