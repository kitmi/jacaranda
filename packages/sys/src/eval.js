import vm from 'node:vm';
import { quote } from '@kitmi/utils';

/**
 * Interpolate a string with variables.
 * @function module:eval.interpolate
 * @param {Srting} str - Text to interpolate
 * @param {*} [variables] - Variables to interpolate
 * @returns {*}
 */
export function interpolate(str, variables) {
    return vm.runInNewContext(quote(str, '`'), variables);
}

/**
 * Evaluate an expression.
 * @function module:eval.evaluate
 * @param {String} expr - Expression to evaluate
 * @param {*} [variables] - Variables as local scope
 * @returns {*}
 */
export function evaluate(expr, variables) {
    return vm.runInNewContext('() => (' + expr + ')', variables)();
}
