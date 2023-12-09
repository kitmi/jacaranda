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
const _worker = /*#__PURE__*/ _interop_require_default(require("./worker"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function startCommand(commandHandler, options) {
    let { commandName, ...cmdOptions } = options;
    let workerOptions = {
        ...cmdOptions,
        workerName: commandName
    };
    if (workerOptions.config) {
        workerOptions.loadConfigFromOptions = true;
    }
    return (0, _worker.default)(commandHandler, workerOptions);
}
const _default = startCommand;

//# sourceMappingURL=command.js.map