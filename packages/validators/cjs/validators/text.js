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
const _isAlpha = /*#__PURE__*/ _interop_require_default(require("validator/lib/isAlpha"));
const _isAlphanumeric = /*#__PURE__*/ _interop_require_default(require("validator/lib/isAlphanumeric"));
const _isAscii = /*#__PURE__*/ _interop_require_default(require("validator/lib/isAscii"));
const _isBase64 = /*#__PURE__*/ _interop_require_default(require("validator/lib/isBase64"));
const _isByteLength = /*#__PURE__*/ _interop_require_default(require("validator/lib/isByteLength"));
const _isDataURI = /*#__PURE__*/ _interop_require_default(require("validator/lib/isDataURI"));
const _isDate = /*#__PURE__*/ _interop_require_default(require("validator/lib/isDate"));
const _isDecimal = /*#__PURE__*/ _interop_require_default(require("validator/lib/isDecimal"));
const _isEmail = /*#__PURE__*/ _interop_require_default(require("validator/lib/isEmail"));
const _isFQDN = /*#__PURE__*/ _interop_require_default(require("validator/lib/isFQDN"));
const _isHexadecimal = /*#__PURE__*/ _interop_require_default(require("validator/lib/isHexadecimal"));
const _isHexColor = /*#__PURE__*/ _interop_require_default(require("validator/lib/isHexColor"));
const _isIP = /*#__PURE__*/ _interop_require_default(require("validator/lib/isIP"));
const _isLength = /*#__PURE__*/ _interop_require_default(require("validator/lib/isLength"));
const _isLowercase = /*#__PURE__*/ _interop_require_default(require("validator/lib/isLowercase"));
const _isMACAddress = /*#__PURE__*/ _interop_require_default(require("validator/lib/isMACAddress"));
const _isMimeType = /*#__PURE__*/ _interop_require_default(require("validator/lib/isMimeType"));
const _isMobilePhone = /*#__PURE__*/ _interop_require_default(require("validator/lib/isMobilePhone"));
const _isNumeric = /*#__PURE__*/ _interop_require_default(require("validator/lib/isNumeric"));
const _isStrongPassword = /*#__PURE__*/ _interop_require_default(require("validator/lib/isStrongPassword"));
const _isTime = /*#__PURE__*/ _interop_require_default(require("validator/lib/isTime"));
const _isUppercase = /*#__PURE__*/ _interop_require_default(require("validator/lib/isUppercase"));
const _isURL = /*#__PURE__*/ _interop_require_default(require("validator/lib/isURL"));
const _makeValidator = /*#__PURE__*/ _interop_require_default(require("../makeValidator"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const semanticText = {
    alpha: (0, _makeValidator.default)(_isAlpha.default, 'The value is not a valid alpha string.'),
    alphanumeric: (0, _makeValidator.default)(_isAlphanumeric.default, 'The value is not a valid alphanumeric string.'),
    ascii: (0, _makeValidator.default)(_isAscii.default, 'The value is not a valid ascii string.'),
    base64: (0, _makeValidator.default)(_isBase64.default, 'The value is not a valid base64 string.'),
    bytesInRange: (0, _makeValidator.default)(_isByteLength.default, 'The byte length of the value does not falls in a valid range.'),
    dataURI: (0, _makeValidator.default)(_isDataURI.default, 'The value is not a valid data URI.'),
    date: (0, _makeValidator.default)(_isDate.default, 'The value is not a valid date string.'),
    decimal: (0, _makeValidator.default)(_isDecimal.default, 'The value is not a valid decimal string.'),
    email: (0, _makeValidator.default)(_isEmail.default, 'The value is not a valid email.'),
    domain: (0, _makeValidator.default)(_isFQDN.default, 'The value is not a valid domain.'),
    hex: (0, _makeValidator.default)(_isHexadecimal.default, 'The value is not a valid hex string.'),
    hexColor: (0, _makeValidator.default)(_isHexColor.default, 'The value is not a valid hex color.'),
    ip: (0, _makeValidator.default)(_isIP.default, 'The value is not a valid IP address.'),
    inRange: (0, _makeValidator.default)(_isLength.default, 'The length of the value does not falls in a valid range.'),
    lowercase: (0, _makeValidator.default)(_isLowercase.default, 'The value is not a lowercase string.'),
    macAddress: (0, _makeValidator.default)(_isMACAddress.default, 'The value is not a valid MAC address.'),
    mimeType: (0, _makeValidator.default)(_isMimeType.default, 'The value is not a valid MIME type.'),
    mobilePhone: (0, _makeValidator.default)(_isMobilePhone.default, 'The value is not a valid mobile phone number.'),
    numeric: (0, _makeValidator.default)(_isNumeric.default, 'The value is not a valid numeric string.'),
    password: (0, _makeValidator.default)(_isStrongPassword.default, 'The value is not a strong password.'),
    time: (0, _makeValidator.default)(_isTime.default, 'The value is not a valid time string.'),
    uppercase: (0, _makeValidator.default)(_isUppercase.default, 'The value is not an uppercase string.'),
    url: (0, _makeValidator.default)(_isURL.default, 'The value is not a valid URL.')
};
semanticText['alphanum'] = semanticText['alphanumeric'];
semanticText['mobile'] = semanticText['mobilePhone'];
semanticText['num'] = semanticText['numeric'];
semanticText['mime'] = semanticText['mimeType'];
semanticText['number'] = semanticText['decimal'];
const _default = semanticText;

//# sourceMappingURL=text.js.map