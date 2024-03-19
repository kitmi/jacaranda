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
const _utils = require("../utils");
const _validateOperators = /*#__PURE__*/ _interop_require_default(require("../validateOperators"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const nameOfValue = (custom)=>custom?.lowerCase ? 'the value' : 'The value';
const formatName = (0, _utils.namingFactory)(nameOfValue);
const messages = {
    formatName,
    validationErrors: {
        [_validateOperators.default.EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} must be ${JSON.stringify(right)}.`,
        [_validateOperators.default.NOT_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} must not be ${JSON.stringify(right)}.`,
        [_validateOperators.default.NOT]: (name, left, right, context)=>`${formatName(name, left, context)} must not match ${JSON.stringify(right)}.`,
        [_validateOperators.default.GREATER_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} must be greater than ${JSON.stringify(right)}.`,
        [_validateOperators.default.GREATER_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} must be greater than or equal to ${JSON.stringify(right)}.`,
        [_validateOperators.default.LESS_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} must be less than ${JSON.stringify(right)}.`,
        [_validateOperators.default.LESS_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} must not exceed ${JSON.stringify(right)}.`,
        [_validateOperators.default.LENGTH]: (name, left, right, context)=>`The length of ${formatName(name, left, context, {
                lowerCase: true
            })} must be ${JSON.stringify(right)}.`,
        [_validateOperators.default.IN]: (name, left, right, context)=>`${formatName(name, left, context)} must be one of ${JSON.stringify(right)}.`,
        [_validateOperators.default.NOT_IN]: (name, left, right, context)=>`${formatName(name, left, context)} must not be any one of ${JSON.stringify(right)}.`,
        [_validateOperators.default.EXISTS]: (name, left, right, context)=>`${formatName(name, left, context)} ${right ? 'must not be null' : 'must be null'}.`,
        [_validateOperators.default.REQUIRED]: (name, left, right, context)=>`${formatName(name, left, context)} is required.`,
        [_validateOperators.default.TYPE]: (name, left, right, context)=>`The value of ${formatName(name, left, context, {
                lowerCase: true
            })} must be a(n) "${right}".`,
        [_validateOperators.default.MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} must match ${JSON.stringify(right)}.`,
        [_validateOperators.default.MATCH_ANY]: (name, left, right, context)=>`${formatName(name, left, context)} does not match any of given criterias.`,
        [_validateOperators.default.ALL_MATCH]: (name, left, right, context)=>`One of the element of ${formatName(name, left, context, {
                lowerCase: true
            })} does not match the requirement(s).`,
        [_validateOperators.default.ANY_ONE_MATCH]: (name, left, right, context)=>`None of the element of ${formatName(name, left, context, {
                lowerCase: true
            })} matches the requirement(s).`,
        [_validateOperators.default.HAS_KEYS]: (name, left, right, context)=>`${formatName(name, left, context)} must have all of these keys [${Array.isArray(right) ? right.join(', ') : [
                right
            ]}].`,
        [_validateOperators.default.START_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} must start with "${right}".`,
        [_validateOperators.default.END_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} must end with "${right}".`,
        [_validateOperators.default.MATCH_PATTERN]: (name, left, right, context)=>`${formatName(name, left, context)} must match the pattern "${right}".`,
        [_validateOperators.default.CONTAINS]: (name, left, right, context)=>`${formatName(name, left, context)} must contain "${right}".`,
        [_validateOperators.default.SAME_AS]: (name, left, right, context)=>`${formatName(name, left, context)} does not match ${formatName(right)}.`,
        [_validateOperators.default.IF]: (name, left, right, context)=>null
    }
};
const _default = messages;

//# sourceMappingURL=en.js.map