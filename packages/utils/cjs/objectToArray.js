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
const _map = /*#__PURE__*/ _interop_require_default(require("lodash/map"));
const _get = /*#__PURE__*/ _interop_require_default(require("./get"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Convert a k-v paired object into an array pair-by-pair.
 * @alias object.objectToArray
 * @param {*} object
 * @param {*} keyNaming
 * @param {*} valueNaming
 * @returns {array}
 */ const objectToArray = (object, keyNaming, valueNaming, valuePath)=>{
    // (object, elementBuilder)
    if (typeof keyNaming === 'function') {
        if (valueNaming != null || valuePath != null) {
            throw new Error('Invalid argument!');
        }
        return (0, _map.default)(object, keyNaming /* elementBuilder(v, k) => array element */ );
    }
    keyNaming ?? (keyNaming = 'name');
    valueNaming ?? (valueNaming = 'value');
    return (0, _map.default)(object, (v, k)=>({
            [keyNaming]: k,
            [valueNaming]: valuePath ? (0, _get.default)(v, valuePath) : v
        }));
};
const _default = objectToArray;

//# sourceMappingURL=objectToArray.js.map