// JSON Expression Syntax (JES)
import { isInteger, get as _get, getBy, keyAt, valueAt } from '@kitmi/utils';
import config from './config';
import ops from './transformerOperators';
import transform from './transform';
import { test } from './validate';

const MSG = config.messages;

const UNARY = true;
const BINARY = false;

// Collection operators (pure)
const OP_THIS = [ops.THIS, UNARY, '$this', '$@>', '$$CURRENT'];
const OP_PARENT = [ops.PARENT, UNARY, '$parent', '$@<', '$$PARENT'];
const OP_ROOT = [ops.ROOT, UNARY, '$root', '$@^', '$$ROOT'];
const OP_KEY = [ops.KEY, UNARY, '$key', '$$KEY'];

const OP_GET_BY_INDEX = [ops.VALUE_AT, BINARY, '$at', '$getByIndex', '$nth']; // supports -1 as the last index, -2 the second last
const OP_GET_BY_KEY = [ops.GET_BY_KEY, BINARY, '$valueOf', '$getByKey']; // support key path
const OP_KEY_AT = [ops.KEY_AT, BINARY, '$keyAt', '$nthKey'];

const OP_MATCH = [ops.MATCH, BINARY, '$is', '$has', '$match', '$all', '$validate', '$when'];

config.addTransformerToMap(OP_THIS, (left, context) => context.THIS);
config.addTransformerToMap(OP_PARENT, (left, context) => context.PARENT);
config.addTransformerToMap(OP_ROOT, (left, context) => context.ROOT);
config.addTransformerToMap(OP_KEY, (left, context) => context.KEY);

config.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context) => {
    right = transform(undefined, right, context, true);

    if (right != null && !isInteger(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(ops.VALUE_AT));
    }

    return valueAt(left, right);
});

config.addTransformerToMap(OP_GET_BY_KEY, (left, right, context) => {
    right = transform(undefined, right, context, true);

    return getBy(left, right, (obj, key) => transform(obj, key, context));
});

config.addTransformerToMap(OP_KEY_AT, (left, right, context) => {
    right = transform(undefined, right, context, true);

    if (right != null && !isInteger(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(ops.VALUE_AT));
    }

    return keyAt(left, right);
});

const matchOptions = { throwError: false, abortEarly: true, asPredicate: true };

config.addTransformerToMap(OP_MATCH, (left, right, context) => test(left, ops.MATCH, right, matchOptions, context));

export default transform;
