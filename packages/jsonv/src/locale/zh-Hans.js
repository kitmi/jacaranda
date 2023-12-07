import { namingFactory } from '../utils';
import vops from '../validateOperators';

const nameOfValue = () => '变量';
const formatName = namingFactory(nameOfValue);

const messages = {
    formatName,
    validationErrors: {
        [vops.EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值必须为 ${JSON.stringify(right)}。`,
        [vops.NOT_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)}。`,
        [vops.NOT]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)}。`,
        [vops.GREATER_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的数值必须大于 ${right}。`,
        [vops.GREATER_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的数值不能小于 ${right}.`,
        [vops.LESS_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的数值必须小于 ${right}。`,
        [vops.LESS_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的数值不能超过 ${right}。`,
        [vops.IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值必须为 ${JSON.stringify(right)} 其中之一。`,
        [vops.NOT_IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值不能为 ${JSON.stringify(right)} 其中之一。`,
        [vops.EXISTS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值${right ? '不能为空' : '必须为空'}。`,
        [vops.REQUIRED]: (name, left, right, context) => `${formatName(name, left, context)} 是必填项`,
        [vops.TYPE]: (name, left, right, context) =>
            `The value of ${formatName(name, left, context)} 必须是 "${right}" 类型.`,
        [vops.MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必须满足 ${JSON.stringify(right)}。`,
        [vops.MATCH_ANY]: (name, left, right, context) =>
            `${formatName(name, left, context)} 不能为 ${JSON.stringify(right)}。`,
        [vops.ALL_MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的所有项中至少一个不符合要求。`,
        [vops.ANY_ONE_MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的所有项中没有一个符合要求。`,
        [vops.HAS_KEYS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必须包含这些键 [${
                Array.isArray(right) ? right.join(', ') : [right]
            }]。`,
        [vops.START_WITH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必须以 "${right}" 开头。`,
        [vops.END_WITH]: (name, left, right, context) => `${formatName(name, left, context)} 必须以 "${right}" 结尾。`,
        [vops.MATCH_PATTERN]: (name, left, right, context) => `${formatName(name, left, context)} 必须匹配 "${right}"。`,
        [vops.CONTAINS]: (name, left, right, context) => `${formatName(name, left, context)} 必须包含 "${right}".`,
        [vops.SAME_AS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 与 ${formatName(right)} 不一样。`,
    },
};

export default messages;
