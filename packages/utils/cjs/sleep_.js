/**
 * Sleep for milliseconds
 * @alias lang.sleep_
 * @async
 * @param {integer} ms - milliseconds
 * @returns {Promise}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const sleep_ = (ms)=>new Promise((resolve /*, reject*/ )=>{
        setTimeout(resolve, ms);
    });
const _default = sleep_;

//# sourceMappingURL=sleep_.js.map