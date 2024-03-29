// JSON Validation Syntax
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return validatorsFactory;
    }
});
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const _isEqual = /*#__PURE__*/ _interop_require_default(require("lodash/isEqual"));
const _has = /*#__PURE__*/ _interop_require_default(require("lodash/has"));
const _size = /*#__PURE__*/ _interop_require_default(require("lodash/size"));
const _castArray = /*#__PURE__*/ _interop_require_default(require("lodash/castArray"));
const _mapValues = /*#__PURE__*/ _interop_require_default(require("lodash/mapValues"));
const _JsvError = /*#__PURE__*/ _interop_require_default(require("./JsvError"));
const _validate = /*#__PURE__*/ _interop_require_wildcard(require("./validate"));
const _validateOperators = /*#__PURE__*/ _interop_require_default(require("./validateOperators"));
const _transform = require("./transform");
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
function validatorsFactory(config) {
    const MSG = config.messages;
    //Validators [ name, ...operator alias ]
    const OP_EQUAL = [
        _validateOperators.default.EQUAL,
        '$eq',
        '$eql',
        '$equal',
        '$being'
    ];
    const OP_NOT_EQUAL = [
        _validateOperators.default.NOT_EQUAL,
        '$ne',
        '$neq',
        '$notEqual'
    ];
    const OP_NOT = [
        _validateOperators.default.NOT,
        '$not'
    ];
    const OP_GREATER_THAN = [
        _validateOperators.default.GREATER_THAN,
        '$gt',
        '$>',
        '$greaterThan'
    ];
    const OP_GREATER_THAN_OR_EQUAL = [
        _validateOperators.default.GREATER_THAN_OR_EQUAL,
        '$gte',
        '$>=',
        '$greaterThanOrEqual',
        '$min'
    ];
    const OP_LESS_THAN = [
        _validateOperators.default.LESS_THAN,
        '$lt',
        '$<',
        '$lessThan'
    ];
    const OP_LESS_THAN_OR_EQUAL = [
        _validateOperators.default.LESS_THAN_OR_EQUAL,
        '$lte',
        '$<=',
        '$lessThanOrEqual',
        '$max'
    ];
    const OP_LENGTH = [
        _validateOperators.default.LENGTH,
        '$length',
        '$size',
        '$capacity'
    ];
    const OP_IN = [
        _validateOperators.default.IN,
        '$in'
    ];
    const OP_NOT_IN = [
        _validateOperators.default.NOT_IN,
        '$nin',
        '$notIn'
    ];
    const OP_EXISTS = [
        _validateOperators.default.EXISTS,
        '$exist',
        '$exists',
        '$notNull'
    ];
    const OP_REQUIRED = [
        _validateOperators.default.REQUIRED,
        '$required',
        '$mandatory'
    ];
    const OP_MATCH = [
        _validateOperators.default.MATCH,
        '$has',
        '$match',
        '$all',
        '$should',
        '$and'
    ];
    const OP_MATCH_ANY = [
        _validateOperators.default.MATCH_ANY,
        '$any',
        '$or',
        '$either'
    ];
    const OP_ALL_MATCH = [
        _validateOperators.default.ALL_MATCH,
        '$allMatch',
        '|>$all',
        '|>$match'
    ];
    const OP_ANY_ONE_MATCH = [
        _validateOperators.default.ANY_ONE_MATCH,
        '$anyOneMatch',
        '|*$any',
        '|*$match',
        '|*$either'
    ];
    const OP_TYPE = [
        _validateOperators.default.TYPE,
        '$is',
        '$typeOf'
    ];
    const OP_HAS_KEYS = [
        _validateOperators.default.HAS_KEYS,
        '$hasKey',
        '$hasKeys',
        '$withKey',
        '$withKeys'
    ];
    const OP_START_WITH = [
        _validateOperators.default.START_WITH,
        '$startWith',
        '$startsWith'
    ];
    const OP_END_WITH = [
        _validateOperators.default.END_WITH,
        '$endWith',
        '$endsWith'
    ];
    const OP_MATCH_PATTERN = [
        _validateOperators.default.MATCH_PATTERN,
        '$pattern',
        '$matchPattern',
        '$matchRegex'
    ];
    const OP_CONTAINS = [
        _validateOperators.default.CONTAINS,
        '$contain',
        '$contains',
        '$include',
        '$includes'
    ];
    const OP_SAME_AS = [
        _validateOperators.default.SAME_AS,
        '$sameAs'
    ];
    const OP_IF = [
        _validateOperators.default.IF,
        '$if'
    ];
    config.addValidatorToMap(OP_EQUAL, (left, right, options, context1)=>(0, _isEqual.default)(left, (0, _transform.processExprLikeValue)(right, context1)));
    config.addValidatorToMap(OP_NOT_EQUAL, (left, right, options, context1)=>!(0, _isEqual.default)(left, (0, _transform.processExprLikeValue)(right, context1)));
    config.addValidatorToMap(OP_NOT, (left, ...args)=>(0, _validate.test)(left, _validateOperators.default.MATCH, ...args) !== true);
    config.addValidatorToMap(OP_GREATER_THAN, (left, right, options, context1)=>left > (0, _transform.processExprLikeValue)(right, context1));
    config.addValidatorToMap(OP_GREATER_THAN_OR_EQUAL, (left, right, options, context1)=>left >= (0, _transform.processExprLikeValue)(right, context1));
    config.addValidatorToMap(OP_LESS_THAN, (left, right, options, context1)=>left < (0, _transform.processExprLikeValue)(right, context1));
    config.addValidatorToMap(OP_LESS_THAN_OR_EQUAL, (left, right, options, context1)=>left <= (0, _transform.processExprLikeValue)(right, context1));
    config.addValidatorToMap(OP_LENGTH, (left, right, options, context1)=>(0, _validate.test)((0, _size.default)(left), _validateOperators.default.MATCH, right, options, context1));
    config.addValidatorToMap(OP_IN, (left, right, options, context1)=>{
        if (right == null) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.IN));
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.IN));
        }
        const equal = config.getValidator(_validateOperators.default.EQUAL);
        return right.findIndex((element)=>equal(left, element, options, context1)) !== -1;
    });
    config.addValidatorToMap(OP_NOT_IN, (left, right, options, context1)=>{
        if (right == null) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.NOT_IN));
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.NOT_IN));
        }
        const notEqual = config.getValidator(_validateOperators.default.NOT_EQUAL);
        return right.every((element)=>notEqual(left, element, options, context1));
    });
    config.addValidatorToMap(OP_EXISTS, (left, right)=>{
        if (typeof right !== 'boolean') {
            throw new Error(MSG.OPERAND_NOT_BOOL(_validateOperators.default.EXISTS));
        }
        return right ? left != null : left == null;
    });
    config.addValidatorToMap(OP_REQUIRED, (left, right)=>{
        right = (0, _transform.processExprLikeValue)(right, context);
        if (typeof right !== 'boolean') {
            throw new Error(MSG.OPERAND_NOT_BOOL(_validateOperators.default.REQUIRED));
        }
        return right ? left != null : true;
    });
    config.addValidatorToMap(OP_MATCH, (left, right, options, context1)=>{
        if (Array.isArray(right)) {
            const errors = [];
            right.every((rule)=>{
                const reason = (0, _validate.default)(left, rule, {
                    ...options,
                    asPredicate: false
                }, context1);
                if (reason !== true) {
                    errors.push(...(0, _castArray.default)(reason));
                    if (options.abortEarly) {
                        return false;
                    }
                }
                return true;
            });
            if (errors.length > 0) {
                if (options.throwError) {
                    throw new _JsvError.default(errors, left, context1);
                }
                if (!options.asPredicate) {
                    context1.ERROR = errors.length === 1 && options.plainError ? errors[0] : errors;
                }
                return false;
            }
            return true;
        }
        const reason2 = (0, _validate.default)(left, right, options, context1);
        if (reason2 !== true) {
            if (!options.asPredicate) {
                context1.ERROR = reason2;
            }
            return false;
        }
        return true;
    });
    config.addValidatorToMap(OP_MATCH_ANY, (left, right, options, context1)=>{
        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.MATCH_ANY));
        }
        let found = right.find((rule)=>{
            const reason = (0, _validate.default)(left, rule, {
                ...options,
                abortEarly: false,
                throwError: false
            }, context1);
            return reason === true;
        });
        if (!found) {
            context1.ERROR = MSG.validationErrors[_validateOperators.default.MATCH_ANY](context1.name, left, right, context1);
        }
        return found ? true : false;
    });
    config.addValidatorToMap(OP_ALL_MATCH, (left, right, options, context1)=>{
        if (!Array.isArray(left)) {
            throw new Error(MSG.VALUE_NOT_ARRAY(_validateOperators.default.ALL_MATCH));
        }
        const errors = [];
        left.every((leftItem)=>{
            const reason = (0, _validate.default)(leftItem, right, {
                ...options,
                asPredicate: false
            }, context1);
            if (reason !== true) {
                errors.push(MSG.validationErrors[_validateOperators.default.ALL_MATCH](context1.name, left, right, context1), ...(0, _castArray.default)(reason));
                if (options.abortEarly) {
                    return false;
                }
            }
            return true;
        });
        if (errors.length > 0) {
            if (options.throwError) {
                throw new _JsvError.default(errors, left, context1);
            }
            if (!options.asPredicate) {
                context1.ERROR = errors.length === 1 && options.plainError ? errors[0] : errors;
            }
            return false;
        }
        return true;
    });
    config.addValidatorToMap(OP_ANY_ONE_MATCH, (left, right, options, context1)=>{
        if (!Array.isArray(left)) {
            throw new Error(MSG.VALUE_NOT_ARRAY(_validateOperators.default.ANY_ONE_MATCH));
        }
        let found = left.find((leftItem)=>{
            const reason = (0, _validate.default)(leftItem, right, {
                ...options,
                abortEarly: false,
                throwError: false
            }, context1);
            return reason === true;
        });
        if (!found) {
            context1.ERROR = MSG.validationErrors[_validateOperators.default.ANY_ONE_MATCH](context1.name, left, right, context1);
        }
        return found ? true : false;
    });
    config.addValidatorToMap(OP_TYPE, (left, right, options, context1)=>{
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.TYPE));
        }
        if (!_types.Types.primitives.has(right)) {
            throw new Error(MSG.UNSUPPORTED_TYPE(right));
        }
        return _types.Types[right].validate(left);
    });
    config.addValidatorToMap(OP_HAS_KEYS, (left, right)=>{
        if (typeof left !== 'object') {
            return false;
        }
        return Array.isArray(right) ? right.every((key)=>(0, _has.default)(left, key)) : (0, _has.default)(left, right);
    });
    config.addValidatorToMap(OP_START_WITH, (left, right, options, context1)=>{
        if (typeof left !== 'string') {
            return false;
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.START_WITH));
        }
        return left.startsWith(right);
    });
    config.addValidatorToMap(OP_END_WITH, (left, right, options, context1)=>{
        if (typeof left !== 'string') {
            return false;
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.END_WITH));
        }
        return left.endsWith(right);
    });
    config.addValidatorToMap(OP_MATCH_PATTERN, (left, right, options, context1)=>{
        if (typeof left !== 'string') {
            return false;
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        let pattern = right;
        let flags;
        if (Array.isArray(right)) {
            if (right.length > 2) {
                throw new Error(MSG.OPERAND_NOT_TUPLE(_validateOperators.default.MATCH_PATTERN));
            }
            pattern = right[0];
            flags = right[1];
        } else if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.MATCH_PATTERN));
        }
        return new RegExp(pattern, flags).test(left);
    });
    config.addValidatorToMap(OP_CONTAINS, (left, right, options, context1)=>{
        if (typeof left !== 'string') {
            return false;
        }
        right = (0, _transform.processExprLikeValue)(right, context1);
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.CONTAINS));
        }
        return left.includes(right);
    });
    config.addValidatorToMap(OP_SAME_AS, (left, right, options, context1)=>{
        if (typeof left === 'object') {
            throw new Error(MSG.VALUE_NOT_PRIMITIVE(_validateOperators.default.SAME_AS));
        }
        if (typeof right !== 'string') {
            throw new Error(MSG.OPERAND_NOT_STRING(_validateOperators.default.SAME_AS));
        }
        return left === (0, _utils.get)(context1.PARENT, right);
    });
    config.addValidatorToMap(OP_IF, (left, right, options, context1)=>{
        if (!Array.isArray(right)) {
            throw new Error(MSG.OPERAND_NOT_ARRAY(_validateOperators.default.IF));
        }
        if (right.length < 2 || right.length > 3) {
            throw new Error(MSG.OPERAND_NOT_TUPLE_2_OR_3(_validateOperators.default.IF));
        }
        const condition = (0, _transform.processExprLikeValue)(right[0], context1);
        if (typeof condition !== 'boolean') {
            throw new Error(MSG.VALUE_NOT_BOOL(_validateOperators.default.IF));
        }
        let result = true;
        if (condition) {
            result = (0, _validate.default)(left, right[1], options, context1);
        } else if (right.length > 2) {
            result = (0, _validate.default)(left, right[2], options, context1);
        }
        return result;
    });
}

//# sourceMappingURL=validatorsLoader.js.map