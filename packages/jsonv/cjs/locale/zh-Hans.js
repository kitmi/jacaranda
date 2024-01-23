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
const nameOfValue = ()=>'变量';
const formatName = (0, _utils.namingFactory)(nameOfValue);
const messages = {
    formatName,
    validationErrors: {
        [_validateOperators.default.EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的值必须为 ${JSON.stringify(right)}。`,
        [_validateOperators.default.NOT_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)}。`,
        [_validateOperators.default.NOT]: (name, left, right, context)=>`${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)}。`,
        [_validateOperators.default.GREATER_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} 的数值必须大于 ${right}。`,
        [_validateOperators.default.GREATER_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的数值不能小于 ${right}.`,
        [_validateOperators.default.LESS_THAN]: (name, left, right, context)=>`${formatName(name, left, context)} 的数值必须小于 ${right}。`,
        [_validateOperators.default.LESS_THAN_OR_EQUAL]: (name, left, right, context)=>`${formatName(name, left, context)} 的数值不能超过 ${right}。`,
        [_validateOperators.default.LENGTH]: (name, left, right, context)=>`${formatName(name, left, context)} 的长度必须为 ${right}。`,
        [_validateOperators.default.IN]: (name, left, right, context)=>`${formatName(name, left, context)} 的值必须为 ${JSON.stringify(right)} 其中之一。`,
        [_validateOperators.default.NOT_IN]: (name, left, right, context)=>`${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)} 其中之一。`,
        [_validateOperators.default.EXISTS]: (name, left, right, context)=>`${formatName(name, left, context)} 的值${right ? '不能为空' : '必须为空'}。`,
        [_validateOperators.default.REQUIRED]: (name, left, right, context)=>`${formatName(name, left, context)} 是必填项`,
        [_validateOperators.default.TYPE]: (name, left, right, context)=>`The value of ${formatName(name, left, context)} 必须是 "${right}" 类型.`,
        [_validateOperators.default.MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 必须满足 ${JSON.stringify(right)}。`,
        [_validateOperators.default.MATCH_ANY]: (name, left, right, context)=>`${formatName(name, left, context)} 不能为 ${JSON.stringify(right)}。`,
        [_validateOperators.default.ALL_MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 的所有项中至少一个不符合要求。`,
        [_validateOperators.default.ANY_ONE_MATCH]: (name, left, right, context)=>`${formatName(name, left, context)} 的所有项中没有一个符合要求。`,
        [_validateOperators.default.HAS_KEYS]: (name, left, right, context)=>`${formatName(name, left, context)} 必须包含这些键 [${Array.isArray(right) ? right.join(', ') : [
                right
            ]}]。`,
        [_validateOperators.default.START_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} 必须以 "${right}" 开头。`,
        [_validateOperators.default.END_WITH]: (name, left, right, context)=>`${formatName(name, left, context)} 必须以 "${right}" 结尾。`,
        [_validateOperators.default.MATCH_PATTERN]: (name, left, right, context)=>`${formatName(name, left, context)} 必须匹配 "${right}"。`,
        [_validateOperators.default.CONTAINS]: (name, left, right, context)=>`${formatName(name, left, context)} 必须包含 "${right}".`,
        [_validateOperators.default.SAME_AS]: (name, left, right, context)=>`${formatName(name, left, context)} 与 ${formatName(right)} 不一样。`,
        [_validateOperators.default.IF]: (name, left, right, context)=>null
    }
};
const _default = messages;

//# sourceMappingURL=zh-Hans.js.map