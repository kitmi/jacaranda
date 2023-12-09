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
const _App = /*#__PURE__*/ _interop_require_default(require("../App"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Start a worker app
 * @param {Function} worker
 * @param {object} [workerOptions]
 * @property {string} [workerOptions.workerName]
 * @property {boolean} [workerOptions.dontStop] - Don't stop after worker done
 * @property {Function} [workerOptions.initializer]
 */ async function startWorker(worker, options) {
    const { workerName, dontStop, initializer, uninitializer, throwOnError, verbose, ...appOptions } = options || {};
    if (verbose) {
        appOptions.logLevel = 'verbose';
    }
    // create an app instance with custom configuration
    let app = new _App.default(workerName || 'worker', appOptions);
    try {
        await app.start_();
        if (initializer) {
            await initializer(app);
        }
        const result = await worker(app);
        if (dontStop) {
            process.once('SIGINT', ()=>{
                app.stop_();
            });
        } else {
            await app.stop_();
        }
        if (uninitializer) {
            await uninitializer();
        }
        return result;
    } catch (error) {
        if (throwOnError) {
            throw error;
        }
        console.error(verbose ? error : error.message);
        process.exit(1);
    }
}
const _default = startWorker;

//# sourceMappingURL=worker.js.map