// JSON Validation Syntax
import { Types } from '@kit/types';
import { isPlainObject, get as _get } from '@kit/utils';

import _isEqual from 'lodash/isEqual';
import _has from 'lodash/has';
import _size from 'lodash/size';
import _castArray from 'lodash/castArray';
import _mapValues from 'lodash/mapValues';

import JsvError from './JvsError';
import validate, { test } from './validate';

import config, { contextVarKeys } from './config';

import ops from './validateOperators';

const MSG = config.messages;

function evaluateWithContext(value, context) {
    if (value == null) {
        return null;
    }

    if (context == null) {
        context = {};
    }

    const type = typeof value;

    if (type === 'string') {
        if (value.startsWith('$$')) {
            //get from context
            const pos = value.indexOf('.');
            if (pos === -1) {
                if (!contextVarKeys.has(value)) {
                    throw new Error(MSG.SYNTAX_INVALID_CONTEXT(value));
                }
                return context[value];
            }

            const key = value.substring(0, pos);
            if (!contextVarKeys.has(key)) {
                throw new Error(MSG.SYNTAX_INVALID_CONTEXT(key));
            }

            return _get(context, value);
        }

        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => evaluateWithContext(item, context));
    }

    if (type === 'object') {
        return _mapValues(value, (item) => evaluateWithContext(item, context));
    }

    return value;
}

const processRightValue = (right, context) =>
    context.jsonx && ((typeof right === 'string' && right[0] === '$') || isPlainObject(right))
        ? context.jsonx(undefined, right, context, true)
        : evaluateWithContext(right, context);

//Validators [ name, ...operator alias ]
const OP_EQUAL = [ops.EQUAL, '$eq', '$eql', '$equal', '$being'];
const OP_NOT_EQUAL = [ops.NOT_EQUAL, '$ne', '$neq', '$notEqual'];
const OP_NOT = [ops.NOT, '$not'];
const OP_GREATER_THAN = [ops.GREATER_THAN, '$gt', '$>', '$greaterThan'];
const OP_GREATER_THAN_OR_EQUAL = [ops.GREATER_THAN_OR_EQUAL, '$gte', '$>=', '$greaterThanOrEqual', '$min'];
const OP_LESS_THAN = [ops.LESS_THAN, '$lt', '$<', '$lessThan'];
const OP_LESS_THAN_OR_EQUAL = [ops.LESS_THAN_OR_EQUAL, '$lte', '$<=', '$lessThanOrEqual', '$max'];
const OP_LENGTH = [ops.LENGTH, '$length', '$size', '$capacity'];
const OP_IN = [ops.IN, '$in'];
const OP_NOT_IN = [ops.NOT_IN, '$nin', '$notIn'];
const OP_EXISTS = [ops.EXISTS, '$exist', '$exists', '$notNull'];
const OP_REQUIRED = [ops.REQUIRED, '$required', '$mandatory'];
const OP_MATCH = [ops.MATCH, '$has', '$match', '$all', '$should'];
const OP_MATCH_ANY = [ops.MATCH_ANY, '$any', '$or', '$either'];
const OP_ALL_MATCH = [ops.ALL_MATCH, '$allMatch', '|>$all', '|>$match'];
const OP_ANY_ONE_MATCH = [ops.ANY_ONE_MATCH, '$anyOneMatch', '|*$any', '|*$match', '|*$either'];
const OP_TYPE = [ops.TYPE, '$is', '$typeOf'];
const OP_HAS_KEYS = [ops.HAS_KEYS, '$hasKey', '$hasKeys', '$withKey', '$withKeys'];
const OP_START_WITH = [ops.START_WITH, '$startWith', '$startsWith'];
const OP_END_WITH = [ops.END_WITH, '$endWith', '$endsWith'];
const OP_MATCH_PATTERN = [ops.MATCH_PATTERN, '$pattern', '$matchPattern', '$matchRegex'];
const OP_CONTAINS = [ops.CONTAINS, '$contain', '$contains', '$include', '$includes'];
const OP_SAME_AS = [ops.SAME_AS, '$sameAs'];

config.addValidatorToMap(OP_EQUAL, (left, right, options, context) =>
    _isEqual(left, processRightValue(right, context))
);
config.addValidatorToMap(
    OP_NOT_EQUAL,
    (left, right, options, context) => !_isEqual(left, processRightValue(right, context))
);
config.addValidatorToMap(OP_NOT, (left, ...args) => !test(left, ops.MATCH, ...args));
config.addValidatorToMap(OP_GREATER_THAN, (left, right, options, context) => left > processRightValue(right, context));
config.addValidatorToMap(
    OP_GREATER_THAN_OR_EQUAL,
    (left, right, options, context) => left >= processRightValue(right, context)
);
config.addValidatorToMap(OP_LESS_THAN, (left, right, options, context) => left < processRightValue(right, context));
config.addValidatorToMap(
    OP_LESS_THAN_OR_EQUAL,
    (left, right, options, context) => left <= processRightValue(right, context)
);
config.addValidatorToMap(OP_LENGTH, (left, right, options, context) =>
    test(_size(left), ops.MATCH, right, options, context)
);

config.addValidatorToMap(OP_IN, (left, right, options, context) => {
    if (right == null) {
        return false;
    }

    right = processRightValue(right, context);

    if (!Array.isArray(right)) {
        throw new Error(MSG.OPERAND_NOT_ARRAY(ops.IN));
    }

    const equal = config.getValidator(ops.EQUAL);
    return right.find((element) => equal(left, element, options, context));
});

config.addValidatorToMap(OP_NOT_IN, (left, right, options, context) => {
    if (right == null) {
        return true;
    }

    right = processRightValue(right, context);

    if (!Array.isArray(right)) {
        throw new Error(MSG.OPERAND_NOT_ARRAY(ops.NOT_IN));
    }

    const notEqual = config.getValidator(ops.NOT_EQUAL);

    return right.every((element) => notEqual(left, element, options, context));
});

config.addValidatorToMap(OP_EXISTS, (left, right) => {
    if (typeof right !== 'boolean') {
        throw new Error(MSG.OPERAND_NOT_BOOL(ops.EXISTS));
    }

    return right ? left != null : left == null;
});

config.addValidatorToMap(OP_REQUIRED, (left, right) => {
    if (typeof right !== 'boolean') {
        throw new Error(MSG.OPERAND_NOT_BOOL(ops.OP_REQUIRED));
    }

    return right ? left != null : true;
});

config.addValidatorToMap(OP_MATCH, (left, right, options, context) => {
    if (Array.isArray(right)) {
        const errors = [];

        right.every((rule) => {
            const reason = validate(left, rule, { ...options, asPredicate: false }, context);

            if (reason !== true) {
                errors.push(..._castArray(reason));

                if (options.abortEarly) {
                    return false;
                }
            }

            return true;
        });

        if (errors.length > 0) {
            if (options.throwError) {
                throw new JsvError(errors, left, context.path);
            }

            if (!options.asPredicate) {
                context.$$ERROR = errors.length === 1 && options.plainError ? errors[0] : errors;
            }

            return false;
        }

        return true;
    }

    const reason2 = validate(left, right, options, context);
    if (reason2 !== true) {
        if (!options.asPredicate) {
            context.$$ERROR = reason2;
        }

        return false;
    }

    return true;
});

config.addValidatorToMap(OP_MATCH_ANY, (left, right, options, context) => {
    if (!Array.isArray(right)) {
        throw new Error(MSG.OPERAND_NOT_ARRAY(ops.MATCH_ANY));
    }

    let found = right.find((rule) => {
        const reason = validate(left, rule, { ...options, abortEarly: false, throwError: false }, context);
        return reason === true;
    });

    if (!found) {
        context.$$ERROR = MSG.validationErrors[ops.MATCH_ANY](context.name, left, right, context);
    }

    return found ? true : false;
});

config.addValidatorToMap(OP_ALL_MATCH, (left, right, options, context) => {
    if (!Array.isArray(left)) {
        throw new Error(MSG.VALUE_NOT_ARRAY(ops.ALL_MATCH));
    }

    const errors = [];

    left.every((leftItem) => {
        const reason = validate(leftItem, right, { ...options, asPredicate: false }, context);
        if (reason !== true) {
            errors.push(MSG.validationErrors[ops.ALL_MATCH](context.name, left, right, context), ..._castArray(reason));

            if (options.abortEarly) {
                return false;
            }
        }

        return true;
    });

    if (errors.length > 0) {
        if (options.throwError) {
            throw new JsvError(errors, left, context.path);
        }

        if (!options.asPredicate) {
            context.$$ERROR = errors.length === 1 && options.plainError ? errors[0] : errors;
        }

        return false;
    }

    return true;
});

config.addValidatorToMap(OP_ANY_ONE_MATCH, (left, right, options, context) => {
    if (!Array.isArray(left)) {
        throw new Error(MSG.VALUE_NOT_ARRAY(ops.ANY_ONE_MATCH));
    }

    let found = left.find((leftItem) => {
        const reason = validate(leftItem, right, { ...options, abortEarly: false, throwError: false }, context);
        return reason === true;
    });

    if (!found) {
        context.$$ERROR = MSG.validationErrors[ops.ANY_ONE_MATCH](context.name, left, right, context);
    }

    return found ? true : false;
});

config.addValidatorToMap(OP_TYPE, (left, right, options, context) => {
    if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.TYPE));
    }

    if (!Types.primitives.has(right)) {
        throw new Error(MSG.UNSUPPORTED_TYPE(right));
    }

    return Types[right].validate(left);
});

config.addValidatorToMap(OP_HAS_KEYS, (left, right) => {
    if (typeof left !== 'object') {
        return false;
    }

    return Array.isArray(right) ? right.every((key) => _has(left, key)) : _has(left, right);
});

config.addValidatorToMap(OP_START_WITH, (left, right, options, context) => {
    if (typeof left !== 'string') {
        return false;
    }

    right = processRightValue(right, context);

    if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.START_WITH));
    }

    return left.startsWith(right);
});

config.addValidatorToMap(OP_END_WITH, (left, right, options, context) => {
    if (typeof left !== 'string') {
        return false;
    }

    right = processRightValue(right, context);

    if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.END_WITH));
    }

    return left.endsWith(right);
});

config.addValidatorToMap(OP_MATCH_PATTERN, (left, right, options, context) => {
    if (typeof left !== 'string') {
        return false;
    }

    right = processRightValue(right, context);

    let pattern = right;
    let flags;

    if (Array.isArray(right)) {
        if (right.length > 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(ops.MATCH_PATTERN));
        }

        pattern = right[0];
        flags = right[1];
    } else if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.MATCH_PATTERN));
    }

    return new RegExp(pattern, flags).test(left);
});

config.addValidatorToMap(OP_CONTAINS, (left, right, options, context) => {
    if (typeof left !== 'string') {
        return false;
    }

    right = processRightValue(right, context);

    if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.CONTAINS));
    }

    return left.includes(right);
});

config.addValidatorToMap(OP_SAME_AS, (left, right, options, context) => {
    if (typeof left === 'object') {
        throw new Error(MSG.VALUE_NOT_PRIMITIVE(ops.OP_SAME_AS));
    }
    if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(ops.OP_SAME_AS));
    }

    return left === _get(context.$$PARENT, right);
});

export default validate;
