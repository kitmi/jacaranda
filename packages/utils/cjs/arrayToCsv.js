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
const _quote = /*#__PURE__*/ _interop_require_default(require("./quote"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Convert an array to CSV string.
 * @alias array.arrayToCsv
 * @param {Array} data 
 * @param {*} [separator=','] - Separator, default , 
 * @param {*} [replacer] - Replacer function 
 * @returns {String}
 */ const arrayToCsv = (data, separator = ',', replacer)=>{
    if (data == null) {
        return '';
    }
    if (!Array.isArray(data)) {
        throw new Error('The target argument should be an array.');
    }
    return data.map((elem)=>{
        elem = replacer ? replacer(elem) : elem.toString();
        return elem.indexOf(separator) !== -1 ? (0, _quote.default)(elem, '"') : elem;
    }).join(separator);
};
const _default = arrayToCsv;

//# sourceMappingURL=arrayToCsv.js.map