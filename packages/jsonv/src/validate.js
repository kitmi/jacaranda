// JSON Validation Syntax
import { get as _get, esmCheck } from '@kitmi/utils';
import JsvError from './JvsError';
import config, { getChildContext } from './config';
import ops from './validateOperators';

const MSG = config.messages;
const DEFAULT_LOCALE = 'en';

function getUnmatchedExplanation(op, leftValue, rightValue, context) {
    if (context.$$ERROR) {
        return context.$$ERROR;
    }

    let getter;

    if (MSG.validationErrors) {
        getter = MSG.validationErrors[op];
    } else {
        let locale = context.locale || DEFAULT_LOCALE;
        if (!config.supportedLocales.has(locale)) {
            locale = DEFAULT_LOCALE;
        }
        const messages = esmCheck(require('./locale/' + locale));
        getter = messages.validationErrors[op];
    }

    return getter(context.name, leftValue, rightValue, context);
}

/**
 * Tests whether a left-hand value satisfies a given operator and right-hand value.
 * @param {*} left - The left-hand value to test.
 * @param {string} op - The operator to use for the test.
 * @param {*} right - The right-hand value to test against.
 * @param {Object} options - Options to use for the test.
 * @param {Object} context - The current context of the data structure being validated.
 * @returns {*} The result of the test.
 * @throws {Error} If the specified operator does not have a registered validator.
 */
export function test(left, op, right, options, context) {
    const handler = config.getValidator(op);

    if (!handler) {
        throw new Error(MSG.INVALID_TEST_HANLDER(op));
    }

    return handler(left, right, options, context);
}

/**
 * Validate the given object with JSON Expression Syntax (JES)
 * @param {*} actual - The object to match
 * @param {*} jvs - Expected state in JSON Expression Syntax
 * @param {*} options - Validation options
 * @param {*} context - Validation context
 * @returns {array} - [ {boolean} matched, {string} unmatchedReason ]
 */
function validate(actual, jvs, options, context = {}) {
    if (jvs == null) {
        return true;
    }

    const type = typeof jvs;

    if (type === 'string') {
        if (jvs.length === 0 || jvs[0] !== '$') {
            throw new Error(MSG.SYNTAX_INVALID_EXPR(jvs));
        }

        if (jvs.startsWith('$$')) {
            return validate(actual, { $equal: jvs }, options, context);
        }

        return validate(actual, { [jvs]: null }, options, context);
    }

    const { throwError, abortEarly, asPredicate, plainError } = options;

    if (Array.isArray(jvs)) {
        return validate(actual, { $match: jvs }, options, context);
    }

    if (type !== 'object') {
        return validate(actual, { $equal: jvs }, options, context);
    }

    let { path } = context;
    const errors = [];
    const _options = !abortEarly && throwError ? { ...options, throwError: false } : options;

    for (let operator in jvs) {
        let op, left, _context;

        const opValue = jvs[operator];

        if (
            // $match
            (operator.length > 1 && operator[0] === '$') ||
            // |>$all
            (operator.length > 3 && operator[0] === '|' && operator[2] === '$')
        ) {
            //validator
            op = config.getValidatorTag(operator);
            if (!op) {
                throw new Error(MSG.UNSUPPORTED_VALIDATION_OP(operator, path));
            }

            left = actual;
            _context = context;
        } else {
            const fieldName = operator;
            let isComplexKey = fieldName.indexOf('.') !== -1;

            //pick a field and then apply manipulation
            left = actual != null ? (isComplexKey ? _get(actual, fieldName) : actual[fieldName]) : undefined;

            _context = getChildContext(context, actual, fieldName, left);

            if (opValue != null && typeof opValue === 'object') {
                op = ops.MATCH;
            } else {
                op = ops.EQUAL;
            }
        }

        if (!test(left, op, opValue, _options, _context)) {
            if (asPredicate) {
                return false;
            }

            const reason = getUnmatchedExplanation(op, left, opValue, _context);
            if (abortEarly && throwError) {
                throw new JsvError(reason, left, _context.path);
            }

            errors.push(plainError ? reason : new JsvError(reason, left, _context.path));
            if (abortEarly) {
                break;
            }
        }
    }

    if (errors.length > 0) {
        if (asPredicate) {
            return false;
        }

        if (throwError) {
            throw new JsvError(errors, actual, path);
        }

        return errors.length === 1 && plainError ? errors[0] : errors;
    }

    return true;
}

export default validate;
