// JSON Validation Syntax
import { Types } from '@kitmi/types';
import { get as _get } from '@kitmi/utils';

import _isEqual from 'lodash/isEqual';
import _find from 'lodash/find';
import _has from 'lodash/has';
import _size from 'lodash/size';
import _castArray from 'lodash/castArray';
import _mapValues from 'lodash/mapValues';

import { getChildContext } from './config';
import validate, { handleErrors, handleResult, test } from './validate';

import ops from './validateOperators';

import transform, { processExprLikeValue } from './transform';

const transfromOrValidate = (left, exprLikeValue, options, context) =>
    typeof exprLikeValue === 'object' && exprLikeValue?.$expr !== undefined
        ? transform(left, exprLikeValue.$expr, context)
        : handleResult(validate(left, exprLikeValue, options, context), options, context);

export default function validatorsFactory(config) {
    const MSG = config.messages;

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
    const OP_MATCH = [ops.MATCH, '$has', '$match', '$all', '$should', '$and'];
    const OP_MATCH_ANY = [ops.MATCH_ANY, '$any', '$or', '$either'];
    const OP_ALL_MATCH = [ops.ALL_MATCH, '$allMatch', '|>$all', '|>$match'];
    const OP_ALL_VALUES_MATCH = [ops.ALL_VALUES_MATCH, '$allValuesMatch', '|>$value'];
    const OP_ANY_ONE_MATCH = [ops.ANY_ONE_MATCH, '$anyOneMatch', '|*$any', '|*$match', '|*$either'];
    const OP_TYPE = [ops.TYPE, '$isType', '$typeOf'];
    const OP_HAS_KEYS = [ops.HAS_KEYS, '$hasKey', '$hasKeys', '$withKey', '$withKeys'];
    const OP_START_WITH = [ops.START_WITH, '$startWith', '$startsWith'];
    const OP_END_WITH = [ops.END_WITH, '$endWith', '$endsWith'];
    const OP_MATCH_PATTERN = [ops.MATCH_PATTERN, '$pattern', '$matchPattern', '$matchRegex'];
    const OP_CONTAINS = [ops.CONTAINS, '$contain', '$contains', '$include', '$includes'];
    const OP_SAME_AS = [ops.SAME_AS, '$sameAs'];

    const OP_IF = [ops.IF, '$if'];

    config.addValidatorToMap(OP_EQUAL, (left, right, options, context) =>
        _isEqual(left, processExprLikeValue(right, context))
    );
    config.addValidatorToMap(
        OP_NOT_EQUAL,
        (left, right, options, context) => !_isEqual(left, processExprLikeValue(right, context))
    );
    config.addValidatorToMap(OP_NOT, (left, ...args) => test(left, ops.MATCH, ...args) !== true);
    config.addValidatorToMap(
        OP_GREATER_THAN,
        (left, right, options, context) => left > processExprLikeValue(right, context)
    );
    config.addValidatorToMap(
        OP_GREATER_THAN_OR_EQUAL,
        (left, right, options, context) => left >= processExprLikeValue(right, context)
    );
    config.addValidatorToMap(
        OP_LESS_THAN,
        (left, right, options, context) => left < processExprLikeValue(right, context)
    );
    config.addValidatorToMap(
        OP_LESS_THAN_OR_EQUAL,
        (left, right, options, context) => left <= processExprLikeValue(right, context)
    );
    config.addValidatorToMap(OP_LENGTH, (left, right, options, context) =>
        test(_size(left), ops.MATCH, right, options, context)
    );

    config.addValidatorToMap(OP_IN, (left, right, options, context) => {
        if (right == null) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(ops.IN));
        }

        right = processExprLikeValue(right, context);

        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(ops.IN));
        }

        const equal = config.getValidator(ops.EQUAL);
        return right.findIndex((element) => equal(left, element, options, context)) !== -1;
    });

    config.addValidatorToMap(OP_NOT_IN, (left, right, options, context) => {
        if (right == null) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(ops.NOT_IN));
        }

        right = processExprLikeValue(right, context);

        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(ops.NOT_IN));
        }

        const notEqual = config.getValidator(ops.NOT_EQUAL);

        return right.every((element) => notEqual(left, element, options, context));
    });

    config.addValidatorToMap(OP_EXISTS, (left, right, options, context) => {
        right = processExprLikeValue(right, context);

        if (typeof right !== 'boolean') {
            throw new Error(MSG.OPERAND_NOT_BOOL(ops.EXISTS));
        }

        return right ? left != null : left == null;
    });

    config.addValidatorToMap(OP_REQUIRED, (left, right, options, context) => {
        right = processExprLikeValue(right, context);

        if (typeof right !== 'boolean') {
            throw new Error(MSG.OPERAND_NOT_BOOL(ops.REQUIRED));
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

            return handleErrors(errors, options, context);
        }

        return handleResult(validate(left, right, options, context), options, context);
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
            context.ERROR = MSG.validationErrors[ops.MATCH_ANY](context.name, left, right, context);
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
                if (options.abortEarly) {
                    errors.push(
                        MSG.validationErrors[ops.ALL_MATCH](context.name, left, right, context),
                        ..._castArray(reason)
                    );
                    return false;
                } else {
                    errors.push(..._castArray(reason));
                }
            }

            return true;
        });

        return handleErrors(errors, options, context);
    });

    config.addValidatorToMap(OP_ALL_VALUES_MATCH, (left, right, options, context) => {
        if (typeof left !== 'object') {
            throw new Error(MSG.VALUE_NOT_OBJECT(ops.ALL_VALUES_MATCH));
        }

        const errors = [];

        _find(left, (leftValue, leftKey) => {
            const reason = validate(
                leftValue,
                right,
                { ...options, asPredicate: false },
                getChildContext(context, left, leftKey, leftValue)
            );
            if (reason !== true) {
                if (options.abortEarly) {
                    errors.push(
                        MSG.validationErrors[ops.ALL_MATCH](context.name, left, right, context),
                        ..._castArray(reason)
                    );

                    return true;
                } else {
                    errors.push(..._castArray(reason));
                }
            }

            return false;
        });

        return handleErrors(errors, options, context);
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
            context.ERROR = MSG.validationErrors[ops.ANY_ONE_MATCH](context.name, left, right, context);
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

        return handleResult(Types[right].validate(left), options, context);
    });

    config.addValidatorToMap(OP_HAS_KEYS, (left, right, _options, _context) => {
        if (typeof left !== 'object') {
            return false;
        }

        return Array.isArray(right) ? right.every((key) => _has(left, key)) : _has(left, right);
    });

    config.addValidatorToMap(OP_START_WITH, (left, right, _options, context) => {
        if (typeof left !== 'string') {
            return false;
        }

        right = processExprLikeValue(right, context);

        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(ops.START_WITH));
        }

        return left.startsWith(right);
    });

    config.addValidatorToMap(OP_END_WITH, (left, right, options, context) => {
        if (typeof left !== 'string') {
            return false;
        }

        right = processExprLikeValue(right, context);

        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(ops.END_WITH));
        }

        return left.endsWith(right);
    });

    config.addValidatorToMap(OP_MATCH_PATTERN, (left, right, options, context) => {
        if (typeof left !== 'string') {
            return false;
        }

        right = processExprLikeValue(right, context);

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

        right = processExprLikeValue(right, context);

        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(ops.CONTAINS));
        }

        return left.includes(right);
    });

    config.addValidatorToMap(OP_SAME_AS, (left, right, options, context) => {
        if (typeof left === 'object') {
            throw new Error(MSG.VALUE_NOT_PRIMITIVE(ops.SAME_AS));
        }
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(ops.SAME_AS));
        }

        return left === _get(context.PARENT, right);
    });

    config.addValidatorToMap(OP_IF, (left, right, options, context) => {
        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(ops.IF));
        }

        if (right.length < 2 || right.length > 3) {
            throw new Error(MSG.OPERAND_NOT_TUPLE_2_OR_3(ops.IF));
        }

        const condition = processExprLikeValue(right[0], context);

        if (typeof condition !== 'boolean') {
            throw new Error(MSG.VALUE_NOT_BOOL(ops.IF));
        }

        let result = true;

        if (condition) {
            result = transfromOrValidate(left, right[1], options, context);
        } else if (right.length > 2) {
            result = transfromOrValidate(left, right[2], options, context);
        }

        if (typeof result !== 'boolean') {
            throw new Error(MSG.INVALID_OP_EXPR(ops.IF, condition ? right[1] : right[2], 'result as boolean'));
        }

        return result;
    });
}
