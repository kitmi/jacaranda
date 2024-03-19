// JSON Expression Syntax (JES)
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return transformersFactory;
    },
    matchOptions: function() {
        return matchOptions;
    }
});
const _utils = require("@kitmi/utils");
const _transformerOperators = /*#__PURE__*/ _interop_require_default(require("./transformerOperators"));
const _validateOperators = /*#__PURE__*/ _interop_require_default(require("./validateOperators"));
const _transform = /*#__PURE__*/ _interop_require_wildcard(require("./transform"));
const _validate = require("./validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const matchOptions = {
    throwError: false,
    abortEarly: true,
    asPredicate: true
};
function transformersFactory(config) {
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
        '$nth',
        '$valueAt'
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
        '$is',
        '$has',
        '$match',
        '$all',
        '$validate',
        '$when'
    ];
    config.addTransformerToMap(OP_THIS, (left, context)=>context.THIS);
    config.addTransformerToMap(OP_PARENT, (left, context)=>context.PARENT);
    config.addTransformerToMap(OP_ROOT, (left, context)=>context.ROOT);
    config.addTransformerToMap(OP_KEY, (left, context)=>context.KEY);
    config.addTransformerToMap(OP_GET_BY_INDEX, (left, right, context)=>{
        right = (0, _transform.processExprLikeValue)(right, context);
        if (right != null && !(0, _utils.isInteger)(right)) {
            throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
        }
        return (0, _utils.valueAt)(left, right);
    });
    config.addTransformerToMap(OP_GET_BY_KEY, (left, right, context)=>{
        right = (0, _transform.processExprLikeValue)(right, context);
        return (0, _utils.getBy)(left, right, (obj, key)=>(0, _transform.default)(obj, key, context));
    });
    config.addTransformerToMap(OP_KEY_AT, (left, right, context)=>{
        right = (0, _transform.processExprLikeValue)(right, context);
        if (right != null && !(0, _utils.isInteger)(right)) {
            throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.VALUE_AT));
        }
        return (0, _utils.keyAt)(left, right);
    });
    config.addTransformerToMap(OP_MATCH, (left, right, context)=>(0, _validate.test)(left, _validateOperators.default.MATCH, (0, _transform.processExprLikeValue)(right, context), matchOptions, context));
}

//# sourceMappingURL=transformersLoader.js.map