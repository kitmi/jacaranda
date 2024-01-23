// JSON Validation Syntax
import { get as _get } from '@kitmi/utils';
import JsvError from './JsvError';
import { initContext, getChildContext } from './config';
import { isOperator } from './utils';
import ops from './validateOperators';
import transform from './transform'

function getUnmatchedExplanation(op, leftValue, rightValue, context) {
    if (context.ERROR) {
        return context.ERROR;
    }

    const formatter = context.config.messages.validationErrors?.[op];
    if (formatter == null) {
        throw new Error('Missing validation error formatter for operator: ' + op);
    }
    
    return formatter(context.name, leftValue, rightValue, context);
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
    const handler = context.config.getValidator(op);

    if (!handler) {
        throw new Error(context.config.messages.INVALID_TEST_HANLDER(op));
    }

    return handler(left, right, options, context);
}

/**
 * Validate the given object with JSON Expression Syntax (JES)
 * @param {*} actual - The object to match
 * @param {*} jsv - Expected state in JSON Expression Syntax
 * @param {*} options - Validation options
 * @param {*} context - Validation context
 * @returns {array} - [ {boolean} matched, {string} unmatchedReason ]
 */
function validate(actual, jsv, options, context) {
    if (jsv == null) {
        return true;
    }

    context = initContext(context, actual);

    const type = typeof jsv;

    if (type === 'string') {
        if (!isOperator(jsv)) {
            throw new Error(context.config.messages.SYNTAX_INVALID_EXPR(jsv));
        }

        return validate(actual, { [jsv]: null }, options, context);
    }

    const { throwError, abortEarly, asPredicate, plainError } = options;

    if (Array.isArray(jsv)) {
        return validate(actual, { $all: jsv }, options, context);
    }

    if (type !== 'object') {
        return validate(actual, { $equal: jsv }, options, context);
    }

    let { path } = context;
    const errors = [];
    const _options = !abortEarly && throwError ? { ...options, throwError: false } : options;

    for (let fieldName in jsv) {
        let op, left, _context;

        const opValue = jsv[fieldName];

        if (isOperator(fieldName)) {
            //validator
            op = context.config.getValidatorTag(fieldName);
            if (!op) {
                throw new Error(context.config.messages.UNSUPPORTED_VALIDATION_OP(fieldName, path));
            }

            left = actual;
            _context = context;
        } else {
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

        if (test(left, op, opValue, _options, _context) !== true) {
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
