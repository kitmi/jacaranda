// JSON Expression Syntax (JES)
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
const _utils = require("@kitmi/utils");
const _isEmpty = /*#__PURE__*/ _interop_require_default(require("lodash/isEmpty"));
const _reduce = /*#__PURE__*/ _interop_require_default(require("lodash/reduce"));
const _map = /*#__PURE__*/ _interop_require_default(require("lodash/map"));
const _mapValues = /*#__PURE__*/ _interop_require_default(require("lodash/mapValues"));
const _config = require("./config");
const _utils1 = require("./utils");
const _transformerOperators = /*#__PURE__*/ _interop_require_default(require("./transformerOperators"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PFX_MAP = '|>'; // map
const PFX_REDUCE = '|+'; // reduce 1. intermediate = result op [key, value] 2. result = result op intermediate
/**
 * Apply a bianry operator to a value
 * @param {*} value
 * @param {*} op
 * @param {*} opValue
 * @param {*} context
 * @returns {*}
 */ function applyBinaryOperator(value, op, opValue, context) {
    const handler = context.config.getTransformer(op);
    if (!handler) {
        throw new Error(context.config.messages.INVALID_TRANSFORMER_HANDLER(op));
    }
    return handler(value, opValue, context);
}
/**
 * Apply an unary operator to a value
 * @param {*} value
 * @param {*} tag
 * @param {*} context
 * @returns {*}
 */ function applyUnaryOperator(value, tag, context) {
    const handler = context.config.getTransformer(tag);
    if (!handler) {
        throw new Error(context.config.messages.INVALID_TRANSFORMER_HANDLER(tag));
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
 */ function applyOperator(currentValue, rightValue, [op, isUnary], context) {
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
 */ function transformCollection(currentValue, collectionOp, opMeta, expectedFieldValue, context) {
    const isUnary = opMeta[1];
    switch(collectionOp){
        case PFX_MAP:
            return (Array.isArray(currentValue) ? _map.default : _mapValues.default)(currentValue, (item, key)=>applyOperator(item, expectedFieldValue, opMeta, (0, _config.getChildContext)(context, currentValue, key, item)));
        case PFX_REDUCE:
            if (!Array.isArray(expectedFieldValue) || isUnary && expectedFieldValue.length !== 1) {
                throw new Error(context.config.messages.INVALID_COLLECTION_OP_EXPR(_transformerOperators.default.REDUCE, opMeta[0], expectedFieldValue));
            }
            return (0, _reduce.default)(currentValue, (result, item, key)=>applyOperator(result, expectedFieldValue[1], opMeta, (0, _config.getChildContext)(context, currentValue, key, item)), expectedFieldValue[0]);
        default:
            throw new Error(context.config.messages.INVALID_COLLECTION_OP(collectionOp));
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
 * @param {*} jsx
 * @param {*} context
 * @param {boolean} replaceLeft - Whether the expression will replace the left value chain, like a setOp
 * @return {*}
 */ function transform(currentValue, jsx, context, replaceLeft) {
    // Null jsx means
    //  - no change if replaceLeft is false
    //  - undefined if replaceLeft is true
    if (jsx == null) {
        return replaceLeft ? undefined : currentValue;
    }
    context = (0, _config.initContext)(context, currentValue);
    if (Array.isArray(jsx)) {
        if (replaceLeft) {
            return jsx.map((item)=>transform(undefined, item, context, true));
        }
        return jsx.reduce((result, exprItem)=>transform(result, exprItem, context), currentValue);
    }
    const typeExpr = typeof jsx;
    if (typeExpr === 'boolean') {
        if (replaceLeft) {
            return jsx;
        }
        return jsx ? currentValue : undefined;
    }
    if (typeExpr === 'number' || typeExpr === 'bigint') {
        if (replaceLeft) {
            return jsx;
        }
        if ((0, _utils.isInteger)(jsx) && Array.isArray(currentValue)) {
            return currentValue[jsx];
        }
        throw new Error(context.config.messages.SYNTAX_NUMBER_AS_EXPR);
    }
    if (typeExpr === 'string') {
        if (replaceLeft) {
            return jsx;
        }
        if ((0, _utils1.isOperator)(jsx)) {
            const opMeta = context.config.getTransformerTagAndType(jsx);
            if (!opMeta) {
                throw new Error(context.config.messages.INVALID_TRANSFORMER_OP(jsx));
            }
            if (!opMeta[1]) {
                return applyBinaryOperator(currentValue, opMeta[0], null, context);
            }
            return applyUnaryOperator(currentValue, opMeta[0], context);
        }
        if (currentValue != null && typeof currentValue !== 'object') {
            throw new Error(context.config.messages.SYNTAX_INVALID_EXPR(jsx));
        }
        return (0, _utils.get)(currentValue, jsx);
    }
    if (typeExpr !== 'object') {
        throw new Error(context.config.messages.SYNTAX_INVALID_EXPR(jsx));
    }
    if (replaceLeft) {
        return (0, _mapValues.default)(jsx, (item)=>transform(undefined, item, context, true));
    }
    let result, hasOperator = false;
    for(let fieldName in jsx){
        let expectedFieldValue = jsx[fieldName];
        const l = fieldName.length;
        if (l > 1) {
            if (fieldName[0] === '$') {
                if (result) {
                    throw new Error(context.config.messages.SYNTAX_OP_NOT_ALONE);
                }
                const opMeta = context.config.getTransformerTagAndType(fieldName);
                if (!opMeta) {
                    throw new Error(context.config.messages.INVALID_TRANSFORMER_OP(fieldName));
                }
                if (hasOperator) {
                    throw new Error(context.config.messages.SYNTAX_OP_NOT_ALONE);
                }
                result = applyOperator(currentValue, expectedFieldValue, opMeta, context);
                hasOperator = true;
                continue;
            }
            if (l > 3 && fieldName[0] === '|' && fieldName[2] === '$') {
                if (result) {
                    throw new Error(context.config.messages.SYNTAX_OP_NOT_ALONE);
                }
                const collectionOp = fieldName.substring(0, 2);
                fieldName = fieldName.substring(2);
                const opMeta = context.config.getTransformerTagAndType(fieldName);
                if (!opMeta) {
                    throw new Error(context.config.messages.INVALID_TRANSFORMER_OP(fieldName));
                }
                if (hasOperator) {
                    throw new Error(context.config.messages.SYNTAX_OP_NOT_ALONE);
                }
                result = transformCollection(currentValue, collectionOp, opMeta, expectedFieldValue, context);
                hasOperator = true;
                continue;
            }
        }
        if (hasOperator) {
            throw new Error(context.config.messages.SYNTAX_OP_NOT_ALONE);
        }
        let complexKey = fieldName.indexOf('.') !== -1;
        //pick a field and then apply manipulation
        let actualFieldValue = currentValue != null ? complexKey ? (0, _utils.get)(currentValue, fieldName) : currentValue[fieldName] : undefined;
        const childFieldValue = transform(actualFieldValue, expectedFieldValue, (0, _config.getChildContext)(context, currentValue, fieldName, actualFieldValue));
        if (typeof childFieldValue !== 'undefined') {
            result == null && (result = {});
            if (complexKey) {
                (0, _utils.set)(result, fieldName, childFieldValue);
            } else {
                result[fieldName] = childFieldValue;
            }
        }
    }
    return result;
}
const _default = transform;

//# sourceMappingURL=transform.js.map