// JSON Expression Syntax (JES)
import { isInteger, get as _get, getBy, keyAt, valueAt } from '@kitmi/utils';

import t_ops from './transformerOperators';

import transform from './transform';

const MSG = config.messages;

const UNARY = true;
const BINARY = false;

// Collection operators (pure)
const OP_THIS = [t_ops.THIS, UNARY, '$this', '$@>', '$$CURRENT'];
const OP_PARENT = [t_ops.PARENT, UNARY, '$parent', '$@<', '$$PARENT'];
const OP_ROOT = [t_ops.ROOT, UNARY, '$root', '$@^', '$$ROOT'];
const OP_KEY = [t_ops.KEY, UNARY, '$key', '$$KEY'];

const OP_GET_BY_INDEX = [t_ops.VALUE_AT, BINARY, '$at', '$getByIndex', '$nth']; // supports -1 as the last index, -2 the second last
const OP_GET_BY_KEY = [t_ops.GET_BY_KEY, BINARY, '$valueOf', '$getByKey']; // support key path
const OP_KEY_AT = [t_ops.KEY_AT, BINARY, '$keyAt', '$nthKey']; 

config.addTransformerToMap(OP_THIS, (left, right, context) => context.THIS);
config.addTransformerToMap(OP_PARENT, (left, right, context) => context.PARENT);
config.addTransformerToMap(OP_ROOT, (left, right, context) => context.ROOT);
config.addTransformerToMap(OP_KEY, (left, right, context) => context.KEY);

config.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context) => {
    right = transform(undefined, right, context, true); 

    if (right != null && !isInteger(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(t_ops.VALUE_AT));
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
        throw new Error(MSG.INVALID_OP_EXPR(t_ops.VALUE_AT));
    }

    return keyAt(left, right);
});