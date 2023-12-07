// JSON Expression Syntax (JES)
import { get as _get, set as _set } from '@galaxar/utils';

import _isEmpty from 'lodash/isEmpty';
import _reduce from 'lodash/reduce';
import _map from 'lodash/map';
import _mapValues from 'lodash/mapValues';

import config, { getChildContext } from './config';
import ops from './transformerOperators';

const MSG = config.messages;

const PFX_MAP = '|>'; // map
const PFX_REDUCE = '|+'; // reduce 1. intermediate = result op [key, value] 2. result = result op intermediate

/**
 * Apply a bianry operator to a value
 * @param {*} value
 * @param {*} op
 * @param {*} opValue
 * @param {*} context
 * @returns {*}
 */
function applyBinaryOperator(value, op, opValue, context) {
    const handler = config.getTransformer(op);

    if (!handler) {
        throw new Error(MSG.INVALID_TRANSFORMER_HANDLER(op));
    }

    return handler(value, opValue, context);
}

/**
 * Apply an unary operator to a value
 * @param {*} value
 * @param {*} tag
 * @param {*} context
 * @returns {*}
 */
function applyUnaryOperator(value, tag, context) {
    const handler = config.getTransformer(tag);

    if (!handler) {
        throw new Error(MSG.INVALID_TRANSFORMER_HANDLER(tag));
    }

    return handler(value, context);
}

/**
 * Apply an operator to a value with operator meta
 * @param {*} currentValue
 * @param {*} rightValue
 * @param {*} opMeta
 * @param {*} context
 * @returns {*}
 */
function applyOperator(currentValue, rightValue, [op, isUnary], context) {
    if (isUnary) {
        return applyUnaryOperator(currentValue, op, context);
    }

    return applyBinaryOperator(currentValue, op, rightValue, context);
}

/**
 * Apply an collection iteration operator with operator meta
 * @param {*} currentValue
 * @param {*} collectionOp
 * @param {*} opMeta
 * @param {*} expectedFieldValue
 * @param {*} context
 * @returns {*}
 */
function transformCollection(currentValue, collectionOp, opMeta, expectedFieldValue, context) {
    const isUnary = opMeta[1];

    switch (collectionOp) {
        case PFX_MAP:
            return (Array.isArray(currentValue) ? _map : _mapValues)(currentValue, (item, key) =>
                applyOperator(item, expectedFieldValue, opMeta, getChildContext(context, currentValue, key, item))
            );

        case PFX_REDUCE:
            if (!Array.isArray(expectedFieldValue) || (isUnary && expectedFieldValue.length !== 1)) {
                throw new Error(MSG.INVALID_COLLECTION_OP_EXPR(ops.REDUCE, opMeta[0], expectedFieldValue));
            }

            return _reduce(
                currentValue,
                (result, item, key) =>
                    applyOperator(
                        result,
                        expectedFieldValue[1],
                        opMeta,
                        getChildContext(context, currentValue, key, item)
                    ),
                expectedFieldValue[0]
            );

        default:
            throw new Error(MSG.INVALID_COLLECTION_OP(collectionOp));
    }
}

/**
 * If $ operator used, only one a time is allowed
 * e.g.
 * {
 *    $groupBy: 'key'
 * }
 *
 *
 * @param {*} currentValue
 * @param {*} jxs
 * @param {*} context
 * @param {boolean} replaceLeft - Whether the expression will replace the left value chain, like a setOp
 * @return {*}
 */
function transform(currentValue, jxs, context, replaceLeft) {
    if (jxs == null) {
        return replaceLeft ? jxs : currentValue;
    }

    if (context == null) {
        context = {
            path: null,
            $$ROOT: currentValue,
            $$PARENT: null,
            $$CURRENT: currentValue,
            $$KEY: null,
        };
    }

    if (Array.isArray(jxs)) {
        if (replaceLeft) {
            return jxs.map((item) => transform(undefined, item, { ...context }, true));
        }

        return jxs.reduce((result, exprItem) => transform(result, exprItem, { ...context }), currentValue);
    }

    const typeExpr = typeof jxs;

    if (typeExpr === 'boolean') {
        if (replaceLeft) {
            return jxs;
        }

        return jxs ? currentValue : undefined;
    }

    if (typeExpr === 'number' || typeExpr === 'bigint') {
        if (replaceLeft) {
            return jxs;
        }

        throw new Error(MSG.SYNTAX_NUMBER_AS_EXPR);
    }

    if (typeExpr === 'string') {
        if (jxs.startsWith('$$')) {
            //get from context
            const pos = jxs.indexOf('.');
            if (pos === -1) {
                return context[jxs];
            }

            return _get(context[jxs.substr(0, pos)], jxs.substr(pos + 1));
        }

        if (replaceLeft) {
            return jxs;
        }

        const opMeta = config.getTransformerTagAndType(jxs);
        if (!opMeta) {
            throw new Error(MSG.INVALID_TRANSFORMER_OP(jxs));
        }

        if (!opMeta[1]) {
            return applyBinaryOperator(currentValue, opMeta[0], null, context);
        }

        return applyUnaryOperator(currentValue, opMeta[0], context);
    }

    if (typeExpr !== 'object') {
        throw new Error(MSG.SYNTAX_INVALID_EXPR(jxs));
    }

    if (replaceLeft) {
        return _mapValues(jxs, (item) => transform(undefined, item, context, true));
    }

    let result,
        hasOperator = false;

    for (let fieldName in jxs) {
        let expectedFieldValue = jxs[fieldName];

        const l = fieldName.length;

        if (l > 1) {
            if (fieldName[0] === '$') {
                if (result) {
                    throw new Error(MSG.SYNTAX_OP_NOT_ALONE);
                }

                const opMeta = config.getTransformerTagAndType(fieldName);
                if (!opMeta) {
                    throw new Error(MSG.INVALID_TRANSFORMER_OP(fieldName));
                }

                if (hasOperator) {
                    throw new Error(MSG.SYNTAX_OP_NOT_ALONE);
                }

                result = applyOperator(currentValue, expectedFieldValue, opMeta, context);
                hasOperator = true;
                continue;
            }

            if (l > 3 && fieldName[0] === '|' && fieldName[2] === '$') {
                if (result) {
                    throw new Error(MSG.SYNTAX_OP_NOT_ALONE);
                }

                const collectionOp = fieldName.substring(0, 2);
                fieldName = fieldName.substring(2);

                const opMeta = config.getTransformerTagAndType(fieldName);
                if (!opMeta) {
                    throw new Error(MSG.INVALID_TRANSFORMER_OP(fieldName));
                }

                if (hasOperator) {
                    throw new Error(MSG.SYNTAX_OP_NOT_ALONE);
                }

                result = transformCollection(currentValue, collectionOp, opMeta, expectedFieldValue, context);
                hasOperator = true;
                continue;
            }
        }

        if (hasOperator) {
            throw new Error(MSG.SYNTAX_OP_NOT_ALONE);
        }

        let complexKey = fieldName.indexOf('.') !== -1;

        //pick a field and then apply manipulation
        let actualFieldValue =
            currentValue != null ? (complexKey ? _get(currentValue, fieldName) : currentValue[fieldName]) : undefined;

        const childFieldValue = transform(
            actualFieldValue,
            expectedFieldValue,
            getChildContext(context, currentValue, fieldName, actualFieldValue)
        );

        if (typeof childFieldValue !== 'undefined') {
            result == null && (result = {});
            if (complexKey) {
                _set(result, fieldName, childFieldValue);
            } else {
                result[fieldName] = childFieldValue;
            }
        }
    }

    return result;
}

export default transform;
