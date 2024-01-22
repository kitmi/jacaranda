// JSON Expression Syntax (JES)
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _utils = require("@kitmi/utils");
const _transformerOperators = /*#__PURE__*/ _interop_require_default(require("./transformerOperators"));
const _transform = /*#__PURE__*/ _interop_require_default(require("./transform"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const MSG = config.messages;
const UNARY = true;
const BINARY = false;
// Collection operators (pure)
const OP_THIS = [
    _transformerOperators.default.THIS,
    UNARY,
    '$this',
    '$@>',
    '$$CURRENT'
];
const OP_PARENT = [
    _transformerOperators.default.PARENT,
    UNARY,
    '$parent',
    '$@<',
    '$$PARENT'
];
const OP_ROOT = [
    _transformerOperators.default.ROOT,
    UNARY,
    '$root',
    '$@^',
    '$$ROOT'
];
const OP_KEY = [
    _transformerOperators.default.KEY,
    UNARY,
    '$key',
    '$$KEY'
];
const OP_GET_BY_INDEX = [
    _transformerOperators.default.VALUE_AT,
    BINARY,
    '$at',
    '$getByIndex',
    '$nth'
]; // supports -1 as the last index, -2 the second last
const OP_GET_BY_KEY = [
    _transformerOperators.default.GET_BY_KEY,
    BINARY,
    '$valueOf',
    '$getByKey'
]; // support key path
const OP_KEY_AT = [
    _transformerOperators.default.KEY_AT,
    BINARY,
    '$keyAt',
    '$nthKey'
];
config.addTransformerToMap(OP_THIS, (left, right, context)=>context.THIS);
config.addTransformerToMap(OP_PARENT, (left, right, context)=>context.PARENT);
config.addTransformerToMap(OP_ROOT, (left, right, context)=>context.ROOT);
config.addTransformerToMap(OP_KEY, (left, right, context)=>context.KEY);
config.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    if (right != null && !(0, _utils.isInteger)(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
    }
    return (0, _utils.valueAt)(left, right);
});
config.addTransformerToMap(OP_GET_BY_KEY, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    return (0, _utils.getBy)(left, right, (obj, key)=>(0, _transform.default)(obj, key, context));
});
config.addTransformerToMap(OP_KEY_AT, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    if (right != null && !(0, _utils.isInteger)(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
    }
    return (0, _utils.keyAt)(left, right);
});

//# sourceMappingURL=transformers.js.map