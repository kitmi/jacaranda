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
const _makeValidator = /*#__PURE__*/ _interop_require_default(require("../makeValidator"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const common = {
    max: (0, _makeValidator.default)((value, maxValue)=>value <= maxValue, 'The value must be less than or equal to the max value.'),
    min: (0, _makeValidator.default)((value, minValue)=>value >= minValue, 'The value must be greater than or equal to the min value.'),
    length: (0, _makeValidator.default)((value, length)=>value.length === length, 'The length of the value must be equal to the specified length.'),
    maxLength: (0, _makeValidator.default)((value, maxLength)=>value.length <= maxLength, 'The length of the value must be less than or equal to the max length.'),
    minLength: (0, _makeValidator.default)((value, minLength)=>value.length >= minLength, 'The length of the value must be greater than or equal to the min length.'),
    exist: (0, _makeValidator.default)((value, required)=>!required || value != null, 'The value must not NULL.', true)
};
common.isRequired = common.exist;
const _default = common;

//# sourceMappingURL=common.js.map