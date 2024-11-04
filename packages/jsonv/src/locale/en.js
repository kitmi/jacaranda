import { namingFactory } from '../utils';
import vops from '../validateOperators';

const nameOfValue = (custom) => (custom?.lowerCase ? 'the value' : 'The value');
const formatName = namingFactory(nameOfValue);
const formatValue = value => (typeof value === 'object' && value.$expr) ? (typeof value.$expr === 'object' ? formatValue(value.$expr) : `[${value.$expr}]`) : JSON.stringify(value);

const messages = {
    formatName,
    validationErrors: {
        [vops.EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} must be ${formatValue(right)}.`,
        [vops.NOT_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} must not be ${formatValue(right)}.`,
        [vops.NOT]: (name, left, right, context) =>
            `${formatName(name, left, context)} must not match ${formatValue(right)}.`,
        [vops.GREATER_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} must be greater than ${formatValue(right)}.`,
        [vops.GREATER_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} must be greater than or equal to ${formatValue(right)}.`,
        [vops.LESS_THAN]: (name, left, right, context) =>
            `${formatName(name, left, context)} must be less than ${formatValue(right)}.`,
        [vops.LESS_THAN_OR_EQUAL]: (name, left, right, context) =>
            `${formatName(name, left, context)} must not exceed ${formatValue(right)}.`,
        [vops.LENGTH]: (name, left, right, context) =>
            `The length of ${formatName(name, left, context, {
                lowerCase: true,
            })} must be ${formatValue(right)}.`,
        [vops.IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} must be one of ${formatValue(right)}.`,
        [vops.NOT_IN]: (name, left, right, context) =>
            `${formatName(name, left, context)} must not be any one of ${formatValue(right)}.`,
        [vops.EXISTS]: (name, left, right, context) =>
            `${formatName(name, left, context)} ${right ? 'must not be null' : 'must be null'}.`,
        [vops.REQUIRED]: (name, left, right, context) => `${formatName(name, left, context)} is required.`,
        [vops.TYPE]: (name, left, right, context) =>
            `The value of ${formatName(name, left, context, {
                lowerCase: true,
            })} must be a(n) "${right}".`,
        [vops.MATCH]: (name, left, right, context) =>
            `${formatName(name, left, context)} must match ${formatValue(right)}.`,
        [vops.MATCH_ANY]: (name, left, right, context) =>
            `${formatName(name, left, context)} does not match any of given criterias.`,

        [vops.ALL_MATCH]: (name, left, right, context) =>
            `One of the element of ${formatName(name, left, context, {
                lowerCase: true,
            })} does not match the requirement(s).`,
        [vops.ALL_VALUES_MATCH]: (name, left, right, context) =>
            `One of ${formatName(name, left, context, {
                lowerCase: true,
            })} does not match the requirement(s).`,
        [vops.ANY_ONE_MATCH]: (name, left, right, context) =>
            `None of the element of ${formatName(name, left, context, {
                lowerCase: true,
            })} matches the requirement(s).`,

        [vops.HAS_KEYS]: (name, left, right, context) =>
            `${formatName(name, left, context)} must have all of these keys [${
                Array.isArray(right) ? right.join(', ') : [right]
            }].`,
        [vops.START_WITH]: (name, left, right, context) =>
            `${formatName(name, left, context)} must start with "${right}".`,
        [vops.END_WITH]: (name, left, right, context) => `${formatName(name, left, context)} must end with "${right}".`,
        [vops.MATCH_PATTERN]: (name, left, right, context) =>
            `${formatName(name, left, context)} must match the pattern "${right}".`,
        [vops.CONTAINS]: (name, left, right, context) => `${formatName(name, left, context)} must contain "${right}".`,
        [vops.SAME_AS]: (name, left, right, context) =>
            `${formatName(name, left, context)} does not match ${formatName(right)}.`,
        [vops.IF]: (_name, _left, _right, _context) => null, // error of branch should be returned in context
    },
};

export default messages;
