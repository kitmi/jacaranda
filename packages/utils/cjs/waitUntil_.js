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
const _sleep_ = /*#__PURE__*/ _interop_require_default(require("./sleep_"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Run the checker every given duration for certain rounds until the checker returns non-false value.
 * @alias lang.waitUntil_
 * @async
 * @param {Function} checker - predicator
 * @param {integer} [checkInterval=1000]
 * @param {integer} [maxRounds=10]
 * @returns {Promise.<boolean>}
 */ async function waitUntil_(checker, checkInterval = 1000, maxRounds = 10) {
    let result = await checker();
    if (result) return result;
    let counter = 0;
    do {
        await (0, _sleep_.default)(checkInterval);
        result = await checker();
        if (result) {
            break;
        }
    }while (++counter < maxRounds)
    return result;
}
const _default = waitUntil_;

//# sourceMappingURL=waitUntil_.js.map