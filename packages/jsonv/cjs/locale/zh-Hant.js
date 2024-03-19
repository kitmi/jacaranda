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
const nameOfValue = ()=>'變數';
const formatName = (0, _utils.namingFactory)(nameOfValue);
const messages = {
    formatName,
    validationErrors: {
        [_validateOperators.default.EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的值必須為 ${JSON.stringify(right)}。`,
        [_validateOperators.default.NOT_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的值不能為 ${JSON.stringify(right)}。`,
        [_validateOperators.default.NOT]: (name, left, right, context)=>`${formatName(name, left, context)} 的數值不能為 ${JSON.stringify(right)}。`,
        [_validateOperators.default.GREATER_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} 的數值必須大於 ${right}。`,
        [_validateOperators.default.GREATER_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的數值不能小於 ${right}.`,
        [_validateOperators.default.LESS_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} 的數值必須小於 ${right}。`,
        [_validateOperators.default.LESS_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的數值不能超過 ${right}。`,
        [_validateOperators.default.LENGTH]: (name, left, right, context)=>`${formatName(name, left, context)} 的長度必須為 ${right}。`,
        [_validateOperators.default.IN]: (name, left, right, context)=>`${formatName(name, left, context)} 的值必須為 ${JSON.stringify(right)} 其中之一。`,
        [_validateOperators.default.NOT_IN]: (name, left, right, context)=>`${formatName(name, left, context)} 的值不能為 ${JSON.stringify(right)} 其中之一。`,
        [_validateOperators.default.EXISTS]: (name, left, right, context)=>`${formatName(name, left, context)} 的值${right ? '不能為空' : '必須為空'}。`,
        [_validateOperators.default.REQUIRED]: (name, left, right, context)=>`${formatName(name, left, context)} 是必填項。`,
        [_validateOperators.default.TYPE]: (name, left, right, context)=>`The value of ${formatName(name, left, context)} 必須是 "${right}" 類型.`,
        [_validateOperators.default.MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 必須滿足 ${JSON.stringify(right)}。`,
        [_validateOperators.default.MATCH_ANY]: (name, left, right, context)=>`${formatName(name, left, context)} 不能為 ${JSON.stringify(right)}。`,
        [_validateOperators.default.ALL_MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 的所有項中至少一個不符合要求。`,
        [_validateOperators.default.ANY_ONE_MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 的所有項中没有任何一個符合要求。`,
        [_validateOperators.default.HAS_KEYS]: (name, left, right, context)=>`${formatName(name, left, context)} 必須包含這些鍵 [${Array.isArray(right) ? right.join(', ') : [
                right
            ]}]。`,
        [_validateOperators.default.START_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} 必須以 "${right}" 開頭。`,
        [_validateOperators.default.END_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} 必須以 "${right}" 結尾。`,
        [_validateOperators.default.MATCH_PATTERN]: (name, left, right, context)=>`${formatName(name, left, context)} 必須匹配 "${right}"。`,
        [_validateOperators.default.CONTAINS]: (name, left, right, context)=>`${formatName(name, left, context)} 必須包含 "${right}".`,
        [_validateOperators.default.SAME_AS]: (name, left, right, context)=>`${formatName(name, left, context)} 與 ${formatName(right)} 不一樣。`,
        [_validateOperators.default.IF]: (name, left, right, context)=>null
    }
};
const _default = messages;

//# sourceMappingURL=zh-Hant.js.map