// JSON Expression Syntax (JES)
import { isInteger, get as _get, getBy, keyAt, valueAt } from '@kitmi/utils';
import ops from './transformerOperators';
import transform, { processExprLikeValue } from './transform';
import validate, { handleResult } from './validate';

export const matchOptions = { throwError: false, abortEarly: false, asPredicate: false };
export const queryOptions = { throwError: false, abortEarly: true, asPredicate: true };

export default function transformersFactory(config) {
    const MSG = config.messages;

    const UNARY = true;
    const BINARY = false;

    // Collection operators (pure)
    const OP_THIS = [ops.THIS, UNARY, '$this', '$@>', '$$CURRENT'];
    const OP_PARENT = [ops.PARENT, UNARY, '$parent', '$@<', '$$PARENT'];
    const OP_ROOT = [ops.ROOT, UNARY, '$root', '$@^', '$$ROOT'];
    const OP_KEY = [ops.KEY, UNARY, '$key', '$$KEY'];
    const OP_PAYLOAD = [ops.PAYLOAD, UNARY, '$payload', '$$PAYLOAD'];

    const OP_GET_BY_INDEX = [ops.VALUE_AT, BINARY, '$at', '$getByIndex', '$nth', '$valueAt']; // supports -1 as the last index, -2 the second last
    const OP_GET_BY_KEY = [ops.GET_BY_KEY, BINARY, '$valueOf', '$getByKey']; // support key path
    const OP_KEY_AT = [ops.KEY_AT, BINARY, '$keyAt', '$nthKey'];

    const OP_QUERY = [ops.QUERY, BINARY, '$query', '$is', '$has', '$when'];
    const OP_MATCH = [ops.MATCH, BINARY, '$should', '$must', '$match', '$all', '$validate'];

    config.addTransformerToMap(OP_THIS, (left, context) => context.THIS);
    config.addTransformerToMap(OP_PARENT, (left, context) => context.PARENT);
    config.addTransformerToMap(OP_ROOT, (left, context) => context.ROOT);
    config.addTransformerToMap(OP_KEY, (left, context) => context.KEY);
    config.addTransformerToMap(OP_PAYLOAD, (left, context) => context.PAYLOAD);

    config.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context) => {
        right = processExprLikeValue(right, context);

        if (right != null && !isInteger(right)) {
            throw new Error(MSG.INVALID_OP_EXPR(ops.VALUE_AT));
        }

        return valueAt(left, right);
    });

    config.addTransformerToMap(OP_GET_BY_KEY, (left, right, context) => {
        right = processExprLikeValue(right, context);

        return getBy(left, right, (obj, key) => transform(obj, key, context));
    });

    config.addTransformerToMap(OP_KEY_AT, (left, right, context) => {
        right = processExprLikeValue(right, context);

        if (right != null && !isInteger(right)) {
            throw new Error(MSG.INVALID_OP_EXPR(ops.VALUE_AT));
        }

        return keyAt(left, right);
    });

    config.addTransformerToMap(OP_QUERY, (left, right, context) => {
        right = processExprLikeValue(right, context);

        if (typeof right === 'object') {
            return validate(left, right, queryOptions, context);
        }

        return validate(left, { $eq: right }, queryOptions, context);
    });

    config.addTransformerToMap(OP_MATCH, (left, right, context) => {
        right = processExprLikeValue(right, context);
        right = typeof right === 'object' ? right : { $eq: right };
        
        return handleResult(validate(left, right, matchOptions, context), matchOptions, context);
    });
}
