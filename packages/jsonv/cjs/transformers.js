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
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _transformerOperators = /*#__PURE__*/ _interop_require_default(require("./transformerOperators"));
const _transform = /*#__PURE__*/ _interop_require_default(require("./transform"));
const _validate = require("./validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const MSG = _config.default.messages;
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
const OP_MATCH = [
    _transformerOperators.default.MATCH,
    BINARY,
    '$has',
    '$match',
    '$all',
    '$validate',
    '$when'
];
_config.default.addTransformerToMap(OP_THIS, (left, context)=>context.THIS);
_config.default.addTransformerToMap(OP_PARENT, (left, context)=>context.PARENT);
_config.default.addTransformerToMap(OP_ROOT, (left, context)=>context.ROOT);
_config.default.addTransformerToMap(OP_KEY, (left, context)=>context.KEY);
_config.default.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    if (right != null && !(0, _utils.isInteger)(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
    }
    return (0, _utils.valueAt)(left, right);
});
_config.default.addTransformerToMap(OP_GET_BY_KEY, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    return (0, _utils.getBy)(left, right, (obj, key)=>(0, _transform.default)(obj, key, context));
});
_config.default.addTransformerToMap(OP_KEY_AT, (left, right, context)=>{
    right = (0, _transform.default)(undefined, right, context, true);
    if (right != null && !(0, _utils.isInteger)(right)) {
        throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
    }
    return (0, _utils.keyAt)(left, right);
});
const matchOptions = {
    throwError: false,
    abortEarly: true,
    asPredicate: true
};
_config.default.addTransformerToMap(OP_MATCH, (left, right, context)=>(0, _validate.test)(left, _transformerOperators.default.MATCH, right, matchOptions, context));
const _default = _transform.default;

//# sourceMappingURL=transformers.js.map