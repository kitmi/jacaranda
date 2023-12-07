import { namingFactory } from '../utils';
import vops from '../validateOperators';

const nameOfValue = () => '變數';
const formatName = namingFactory(nameOfValue);

const messages = {
    formatName,
    validationErrors: {
        [vops.EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值必須為 ${JSON.stringify(right)}。`,
        [vops.NOT_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值不能為 ${JSON.stringify(right)}。`,
        [vops.NOT]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的數值不能為 ${JSON.stringify(right)}。`,
        [vops.GREATER_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的數值必須大於 ${right}。`,
        [vops.GREATER_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的數值不能小於 ${right}.`,
        [vops.LESS_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的數值必須小於 ${right}。`,
        [vops.LESS_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的數值不能超過 ${right}。`,
        [vops.IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值必須為 ${JSON.stringify(right)} 其中之一。`,
        [vops.NOT_IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值不能為 ${JSON.stringify(right)} 其中之一。`,
        [vops.EXISTS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的值${right ? '不能為空' : '必須為空'}。`,
        [vops.REQUIRED]: (name, left, right, context) => `${formatName(name, left, context)} 是必填項。`,
        [vops.TYPE]: (name, left, right, context) =>
            `The value of ${formatName(name, left, context)} 必須是 "${right}" 類型.`,
        [vops.MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必須滿足 ${JSON.stringify(right)}。`,
        [vops.MATCH_ANY]: (name, left, right, context) =>
            `${formatName(name, left, context)} 不能為 ${JSON.stringify(right)}。`,
        [vops.ALL_MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的所有項中至少一個不符合要求。`,
        [vops.ANY_ONE_MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 的所有項中没有任何一個符合要求。`,
        [vops.HAS_KEYS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必須包含這些鍵 [${
                Array.isArray(right) ? right.join(', ') : [right]
            }]。`,
        [vops.START_WITH]: (name, left, right, context) =>
            `${formatName(name, left, context)} 必須以 "${right}" 開頭。`,
        [vops.END_WITH]: (name, left, right, context) => `${formatName(name, left, context)} 必須以 "${right}" 結尾。`,
        [vops.MATCH_PATTERN]: (name, left, right, context) => `${formatName(name, left, context)} 必須匹配 "${right}"。`,
        [vops.CONTAINS]: (name, left, right, context) => `${formatName(name, left, context)} 必須包含 "${right}".`,
        [vops.SAME_AS]: (name, left, right, context) =>
            `${formatName(name, left, context)} 與 ${formatName(right)} 不一樣。`,
    },
};

export default messages;
