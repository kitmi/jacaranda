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
const _nodeasync_hooks = require("node:async_hooks");
const _utils = require("mocha/lib/utils");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _promises = /*#__PURE__*/ _interop_require_default(require("node:fs/promises"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const allResources = new Map();
// this will pull Mocha internals out of the stacks
const filterStack = (0, _utils.stackTraceFilter)();
const hook = (0, _nodeasync_hooks.createHook)({
    init (asyncId, type, triggerAsyncId) {
        allResources.set(asyncId, {
            type,
            triggerAsyncId,
            stack: new Error().stack
        });
    },
    destroy (asyncId) {
        allResources.delete(asyncId);
    },
    promiseResolve (asyncId) {
        allResources.delete(asyncId);
    }
}).enable();
const asyncDump = async (dumpFile)=>{
    hook.disable();
    const logs = [];
    allResources.forEach((value)=>{
        const filteredStack = filterStack(value.stack);
        if (filteredStack.includes('at promiseInitHookWithDestroyTracking')) {
            // ignore promiseInitHookWithDestroyTracking
            return;
        }
        logs.push(`Type: ${value.type}`);
        logs.push(filteredStack);
        logs.push('\n');
    });
    dumpFile = _nodepath.default.resolve(process.cwd(), dumpFile || './async-dump.log');
    await _promises.default.writeFile(dumpFile, logs.join('\n'), 'utf8');
    console.log(`Async dump written to ${dumpFile}`);
};
const _default = asyncDump;

//# sourceMappingURL=asyncDump.js.map