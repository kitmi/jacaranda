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
const _types = require("@kitmi/types");
const _jsonv = require("@kitmi/jsonv");
const _transform = /*#__PURE__*/ _interop_require_wildcard(require("@kitmi/jsonv/transform"));
const _transformersLoader = require("@kitmi/jsonv/transformersLoader");
const _config = /*#__PURE__*/ _interop_require_default(require("./config"));
const _size = /*#__PURE__*/ _interop_require_default(require("lodash/size"));
const _reduce = /*#__PURE__*/ _interop_require_default(require("lodash/reduce"));
const _reverse = /*#__PURE__*/ _interop_require_default(require("lodash/reverse"));
const _keys = /*#__PURE__*/ _interop_require_default(require("lodash/keys"));
const _values = /*#__PURE__*/ _interop_require_default(require("lodash/values"));
const _pick = /*#__PURE__*/ _interop_require_default(require("lodash/pick"));
const _pickBy = /*#__PURE__*/ _interop_require_default(require("lodash/pickBy"));
const _nth = /*#__PURE__*/ _interop_require_default(require("lodash/nth"));
const _omit = /*#__PURE__*/ _interop_require_default(require("lodash/omit"));
const _omitBy = /*#__PURE__*/ _interop_require_default(require("lodash/omitBy"));
const _groupBy = /*#__PURE__*/ _interop_require_default(require("lodash/groupBy"));
const _sortBy = /*#__PURE__*/ _interop_require_default(require("lodash/sortBy"));
const _filter = /*#__PURE__*/ _interop_require_default(require("lodash/filter"));
const _map = /*#__PURE__*/ _interop_require_default(require("lodash/map"));
const _mapValues = /*#__PURE__*/ _interop_require_default(require("lodash/mapValues"));
const _findIndex = /*#__PURE__*/ _interop_require_default(require("lodash/findIndex"));
const _findKey = /*#__PURE__*/ _interop_require_default(require("lodash/findKey"));
const _find = /*#__PURE__*/ _interop_require_default(require("lodash/find"));
const _isEqual = /*#__PURE__*/ _interop_require_default(require("lodash/isEqual"));
const _each = /*#__PURE__*/ _interop_require_default(require("lodash/each"));
const _castArray = /*#__PURE__*/ _interop_require_default(require("lodash/castArray"));
const _transformerOperators = /*#__PURE__*/ _interop_require_default(require("./transformerOperators"));
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
const MSG = _config.default.messages;
const UNARY = true;
const BINARY = false;
//Query & aggregate operators (pure)
const OP_SIZE = [
    _transformerOperators.default.SIZE,
    UNARY,
    '$size',
    '$length',
    '$count'
];
const OP_SUM = [
    _transformerOperators.default.SUM,
    UNARY,
    '$sum',
    '$total'
];
const OP_GET_TYPE = [
    _transformerOperators.default.GET_TYPE,
    UNARY,
    '$type',
    '$typeOf'
];
const OP_FIND_INDEX = [
    _transformerOperators.default.FIND_INDEX,
    BINARY,
    '$findIndex',
    '$findKey'
];
const OP_FIND = [
    _transformerOperators.default.FIND,
    BINARY,
    '$find'
];
const OP_IF = [
    _transformerOperators.default.IF,
    BINARY,
    '$if'
];
const OP_CAST_ARRAY = [
    _transformerOperators.default.CAST_ARRAY,
    UNARY,
    '$castArray',
    '$makeArray'
];
//Math operators (pure)
const OP_ADD = [
    _transformerOperators.default.ADD,
    BINARY,
    '$add',
    '$plus',
    '$inc',
    '$+'
];
const OP_SUB = [
    _transformerOperators.default.SUB,
    BINARY,
    '$sub',
    '$subtract',
    '$minus',
    '$dec',
    '$-'
];
const OP_MUL = [
    _transformerOperators.default.MUL,
    BINARY,
    '$mul',
    '$multiply',
    '$times',
    '$*'
];
const OP_DIV = [
    _transformerOperators.default.DIV,
    BINARY,
    '$div',
    '$divide',
    '$/'
];
const OP_MOD = [
    _transformerOperators.default.MOD,
    BINARY,
    '$mod',
    '$remainder',
    '$%'
];
const OP_POW = [
    _transformerOperators.default.POW,
    BINARY,
    '$pow',
    '$power',
    '$^'
];
//Collection operators (pure)
const OP_KEYS = [
    _transformerOperators.default.KEYS,
    UNARY,
    '$keys'
];
const OP_VALUES = [
    _transformerOperators.default.VALUES,
    UNARY,
    '$values'
];
const OP_ENTRIES = [
    _transformerOperators.default.ENTRIES,
    UNARY,
    '$entries',
    '$pairs'
];
const OP_FILTER_NULL = [
    _transformerOperators.default.FILTER_NULL,
    UNARY,
    '$filterNull',
    '$filterNullValues'
];
const OP_OBJ_TO_ARRAY = [
    _transformerOperators.default.OBJ_TO_ARRAY,
    BINARY,
    '$toArray',
    '$objectToArray'
];
const OP_PICK = [
    _transformerOperators.default.PICK,
    BINARY,
    '$pick',
    '$pickBy',
    '$selectByKeys'
]; // filter by key
const OP_OMIT = [
    _transformerOperators.default.OMIT,
    BINARY,
    '$omit',
    '$omitBy',
    '$excludeByKeys'
];
const OP_SLICE = [
    _transformerOperators.default.SLICE,
    BINARY,
    '$slice',
    '$limit'
];
const OP_GROUP = [
    _transformerOperators.default.GROUP,
    BINARY,
    '$group',
    '$groupBy'
];
const OP_SORT = [
    _transformerOperators.default.SORT,
    BINARY,
    '$sort',
    '$orderBy',
    '$sortBy'
];
const OP_REVERSE = [
    _transformerOperators.default.REVERSE,
    UNARY,
    '$reverse'
];
const OP_CONCAT = [
    _transformerOperators.default.CONCAT,
    BINARY,
    '$concat'
];
const OP_JOIN = [
    _transformerOperators.default.JOIN,
    BINARY,
    '$join',
    '$implode'
];
const OP_MERGE = [
    _transformerOperators.default.MERGE,
    BINARY,
    '$merge',
    '$reduce'
]; // merge a list of transform result over the value
const OP_FILTER = [
    _transformerOperators.default.FILTER,
    BINARY,
    '$filter',
    '$select',
    '$filterByValue'
]; // filter by value
const OP_REMAP = [
    _transformerOperators.default.REMAP,
    BINARY,
    '$remap',
    '$mapKeys'
]; // reverse-map, map a key to another name
const OP_TO_JSON = [
    _transformerOperators.default.TO_JSON,
    UNARY,
    '$json',
    '$toJSON',
    '$stringify'
];
const OP_TO_OBJ = [
    _transformerOperators.default.TO_OBJ,
    UNARY,
    '$object',
    '$toObject',
    '$parseJSON'
];
//Value updater (pure)
const OP_SET = [
    _transformerOperators.default.SET,
    BINARY,
    '$set',
    '$=',
    '$value'
];
const OP_ADD_ITEM = [
    _transformerOperators.default.ADD_ITEM,
    BINARY,
    '$addItem',
    '$addFields',
    '$append'
];
const OP_ASSIGN = [
    _transformerOperators.default.ASSIGN,
    BINARY,
    '$assign',
    '$override'
]; // will delete undefined entries
const OP_CREATE = [
    _transformerOperators.default.CREATE,
    BINARY,
    '$new',
    '$create'
]; // create an object based on left value
const OP_APPLY = [
    _transformerOperators.default.APPLY,
    BINARY,
    '$apply',
    '$eval'
]; // to be used in collection, e.g. |>$apply
const OP_SANITIZE = [
    _transformerOperators.default.SANITIZE,
    BINARY,
    '$sanitize'
];
//String manipulate
const OP_SPLIT = [
    _transformerOperators.default.SPLIT,
    BINARY,
    '$split',
    '$explode'
];
const OP_INTERPOLATE = [
    _transformerOperators.default.INTERPOLATE,
    BINARY,
    '$interpolate',
    '$template'
];
_config.default.addTransformerToMap(OP_SIZE, (left)=>(0, _size.default)(left));
_config.default.addTransformerToMap(OP_SUM, (left)=>(0, _reduce.default)(left, (sum, item)=>{
        sum += item;
        return sum;
    }, 0));
_config.default.addTransformerToMap(OP_GET_TYPE, (left)=>(0, _types.typeOf)(left));
_config.default.addTransformerToMap(OP_FIND_INDEX, (left, right, context)=>{
    let jvs;
    let fromIndex = 0;
    if (Array.isArray(right)) {
        if (!Array.isArray(left)) {
            throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.FIND_INDEX));
        }
        if (right.length !== 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.FIND_INDEX));
        }
        jvs = right[0];
        fromIndex = (0, _transform.processExprLikeValue)(right[1], context);
    } else {
        jvs = right;
    }
    const predicate = (value, key)=>(0, _jsonv.validate)(value, jvs, _transformersLoader.matchOptions, (0, _jsonv.getChildContext)(context, left, key, value));
    return Array.isArray(left) ? (0, _findIndex.default)(left, predicate, fromIndex) : (0, _findKey.default)(left, predicate);
});
_config.default.addTransformerToMap(OP_FIND, (left, right, context)=>{
    let jvs;
    let fromIndex = 0;
    if (Array.isArray(right)) {
        if (right.length !== 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.FIND_INDEX));
        }
        jvs = right[0];
        fromIndex = (0, _transform.processExprLikeValue)(right[1], context);
    } else {
        jvs = right;
    }
    const predicate = (value, key)=>(0, _jsonv.validate)(value, jvs, _transformersLoader.matchOptions, (0, _jsonv.getChildContext)(context, left, key, value));
    return (0, _find.default)(left, predicate, fromIndex);
});
_config.default.addTransformerToMap(OP_IF, (left, right, context)=>{
    if (!Array.isArray(right)) {
        throw new Error(MSG.OPERAND_NOT_ARRAY(_transformerOperators.default.IF));
    }
    if (right.length < 2 || right.length > 3) {
        throw new Error(MSG.OPERAND_NOT_TUPLE_2_OR_3(_transformerOperators.default.IF));
    }
    const condition = (0, _transform.default)(left, right[0], context);
    if (typeof condition !== 'boolean') {
        throw new Error(MSG.VALUE_NOT_BOOL(_transformerOperators.default.IF));
    }
    if (condition) {
        return (0, _transform.default)(left, right[1], context);
    } else if (right.length > 2) {
        return (0, _transform.default)(left, right[2], context);
    }
    return left;
});
_config.default.addTransformerToMap(OP_CAST_ARRAY, (left)=>left == null ? null : Array.isArray(left) ? left : [
        left
    ]);
_config.default.addTransformerToMap(OP_ADD, (left, right, context)=>left + (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_SUB, (left, right, context)=>left - (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_MUL, (left, right, context)=>left * (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_DIV, (left, right, context)=>left / (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_MOD, (left, right, context)=>left % (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_POW, (left, right, context)=>left ** (0, _utils.toNumber)((0, _transform.processExprLikeValue)(right, context)));
_config.default.addTransformerToMap(OP_KEYS, (left)=>(0, _keys.default)(left));
_config.default.addTransformerToMap(OP_VALUES, (left)=>(0, _values.default)(left));
_config.default.addTransformerToMap(OP_ENTRIES, (left)=>(0, _map.default)(left, (value, key)=>[
            key,
            value
        ]));
_config.default.addTransformerToMap(OP_OBJ_TO_ARRAY, (left, right, context)=>{
    if (right == null) {
        return (0, _utils.objectToArray)(left);
    }
    return (0, _map.default)(left, (v, k)=>(0, _transform.default)(v, {
            $create: right
        }, (0, _jsonv.getChildContext)(context, left, k, v)));
});
_config.default.addTransformerToMap(OP_FILTER_NULL, (left)=>(0, _utils.filterNull)(left));
_config.default.addTransformerToMap(OP_PICK, (left, right, context)=>{
    if (left == null) {
        return null;
    }
    if (typeof right !== 'object') {
        right = [
            right
        ];
    }
    if (Array.isArray(right)) {
        return (0, _pick.default)(left, right);
    }
    return (0, _pickBy.default)(left, (item, key)=>(0, _jsonv.test)(key, _jsonv.OP.MATCH, right, _transformersLoader.matchOptions, (0, _jsonv.getChildContext)(context, left, key, item)));
});
_config.default.addTransformerToMap(OP_OMIT, (left, right, context)=>{
    if (left == null) {
        return null;
    }
    if (typeof right !== 'object') {
        right = [
            right
        ];
    }
    if (Array.isArray(right)) {
        return (0, _omit.default)(left, right);
    }
    return (0, _omitBy.default)(left, (item, key)=>(0, _jsonv.test)(key, _jsonv.OP.MATCH, right, _transformersLoader.matchOptions, (0, _jsonv.getChildContext)(context, left, key, item)));
});
_config.default.addTransformerToMap(OP_SLICE, (left, right)=>{
    if (left == null) {
        return null;
    }
    if (!Array.isArray(left)) {
        return new Error(MSG.VALUE_NOT_ARRAY(_transformerOperators.default.SLICE));
    }
    if (Number.isInteger(right)) {
        return left.slice(right);
    }
    if (Array.isArray(right)) {
        if (right.length === 0 || right.length > 2) {
            return new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.SLICE, right, [
                'integer',
                '[integer]'
            ]));
        }
        return left.slice(...right);
    }
    return new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.SLICE, right));
});
_config.default.addTransformerToMap(OP_GROUP, (left, right)=>(0, _groupBy.default)(left, right));
_config.default.addTransformerToMap(OP_SORT, (left, right)=>(0, _sortBy.default)(left, right));
_config.default.addTransformerToMap(OP_REVERSE, (left)=>(0, _reverse.default)(left));
_config.default.addTransformerToMap(OP_CONCAT, (left, right)=>{
    if (left == null) {
        left = '';
    }
    right = (0, _transform.processExprLikeValue)(right);
    if (right == null) {
        right = '';
    } else if (Array.isArray(right)) {
        right = right.join('');
    } else if (typeof right !== 'string') {
        throw new Error(MSG.VALUE_NOT_STRING(_transformerOperators.default.CONCAT));
    }
    return left + right;
});
_config.default.addTransformerToMap(OP_JOIN, (left, right)=>{
    if (left == null) {
        return null;
    }
    if (!Array.isArray(left)) {
        throw new Error(MSG.VALUE_NOT_ARRAY(_transformerOperators.default.JOIN));
    }
    right = (0, _transform.processExprLikeValue)(right);
    if (typeof right !== 'string') {
        throw new Error(MSG.VALUE_NOT_STRING(_transformerOperators.default.JOIN));
    }
    return left.join(right);
});
const objectMerger = (left, context)=>[
        (result, expr)=>Object.assign(result, (0, _transform.default)(left, expr, context)),
        {}
    ];
const arrayMerger = (left, context)=>[
        (result, expr)=>[
                ...result,
                ...(0, _castArray.default)((0, _transform.default)(left, expr, context))
            ],
        []
    ];
_config.default.addTransformerToMap(OP_MERGE, (left, right, context)=>{
    if (!Array.isArray(right)) {
        throw new Error(MSG.OPERAND_NOT_ARRAY(_transformerOperators.default.MERGE));
    }
    return right.reduce(...Array.isArray(left) ? arrayMerger(left, context) : objectMerger(left, context));
});
_config.default.addTransformerToMap(OP_FILTER, (left, right, context)=>{
    if (left == null) {
        return null;
    }
    if (typeof left !== 'object') {
        throw new Error(MSG.VALUE_NOT_COLLECTION(_transformerOperators.default.FILTER));
    }
    return (0, _filter.default)(left, (value, key)=>(0, _jsonv.test)(value, _jsonv.OP.MATCH, right, _transformersLoader.matchOptions, (0, _jsonv.getChildContext)(context, left, key, value)));
});
_config.default.addTransformerToMap(OP_REMAP, (left, right)=>{
    if (left == null) {
        return null;
    }
    if (typeof left !== 'object') {
        throw new Error(MSG.VALUE_NOT_COLLECTION(_transformerOperators.default.REMAP));
    }
    if (Array.isArray(right)) {
        if (right.length !== 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.REMAP));
        }
        if (!(0, _utils.isPlainObject)(right[0]) || right[1] != null && typeof right[1] !== 'boolean') {
            throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.REMAP, right, [
                'object',
                'boolean'
            ]));
        }
        return (0, _utils.remap)(left, right[0], right[1]);
    }
    if (!(0, _utils.isPlainObject)(right)) {
        throw new Error(MSG.OPERAND_NOT_OBJECT(_transformerOperators.default.REMAP));
    }
    return (0, _utils.remap)(left, right);
});
_config.default.addTransformerToMap(OP_TO_JSON, (left)=>left == null ? left : JSON.stringify(left));
_config.default.addTransformerToMap(OP_TO_OBJ, (left)=>left == null ? left : JSON.parse(left));
_config.default.addTransformerToMap(OP_SET, (left, right, context)=>(0, _transform.default)(undefined, right, context, true));
_config.default.addTransformerToMap(OP_ADD_ITEM, (left, right, context)=>{
    if (typeof left !== 'object') {
        throw new Error(MSG.VALUE_NOT_COLLECTION(_transformerOperators.default.ADD_ITEM));
    }
    if (Array.isArray(left)) {
        return left.concat((0, _transform.processExprLikeValueWithLeft)(left, right, context));
    }
    if (!Array.isArray(right) || right.length !== 2) {
        throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.ADD_ITEM));
    }
    const key = (0, _transform.processExprLikeValueWithLeft)(left, right[0], context);
    if (typeof key !== 'string') {
        throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.ADD_ITEM, right, [
            'string',
            'any'
        ]));
    }
    return {
        ...left,
        [key]: (0, _transform.processExprLikeValueWithLeft)(left, right[1], context)
    };
});
_config.default.addTransformerToMap(OP_ASSIGN, (left, right, context)=>{
    if (!(0, _utils.isPlainObject)(left)) {
        if (left == null) {
            left = {};
        } else {
            throw new Error(MSG.VALUE_NOT_OBJECT(_transformerOperators.default.ASSIGN));
        }
    }
    if (!(0, _utils.isPlainObject)(right)) {
        throw new Error(MSG.OPERAND_NOT_OBJECT(_transformerOperators.default.ASSIGN));
    }
    const rightValue = (0, _mapValues.default)(right, (expr, key)=>{
        const leftValue = left[key];
        return (0, _transform.processExprLikeValueWithLeft)(leftValue, expr, (0, _jsonv.getChildContext)(context, left, key, leftValue));
    });
    const toRemove = [];
    (0, _each.default)(rightValue, (value, key)=>{
        if (value === undefined) {
            toRemove.push(key);
        }
    });
    const merged = {
        ...left,
        ...rightValue
    };
    return toRemove.length > 0 ? (0, _omit.default)(merged, toRemove) : merged;
});
_config.default.addTransformerToMap(OP_CREATE, (left, right, context)=>{
    return (0, _mapValues.default)(right, (expr)=>(0, _transform.default)(left, expr, context));
});
_config.default.addTransformerToMap(OP_APPLY, _transform.default);
_config.default.addTransformerToMap(OP_SANITIZE, (left, right, context)=>{
    return _types.Types.sanitize(left, (0, _transform.default)(undefined, right, context, true));
});
_config.default.addTransformerToMap(OP_SPLIT, (left, right)=>{
    if (typeof left !== 'string') {
        throw new Error(MSG.VALUE_NOT_STRING(_transformerOperators.default.SPLIT));
    }
    if (Array.isArray(right)) {
        if (right.length !== 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.SPLIT));
        }
        const [separator, limit] = right;
        if (typeof separator !== 'string' || limit != null && typeof limit !== 'number') {
            throw new Error(MSG.INVALID_OP_EXPR(_transformerOperators.default.SPLIT, right, [
                'string',
                'number'
            ]));
        }
        return left.split(separator, limit);
    } else if (typeof right !== 'string') {
        throw new Error(MSG.OPERAND_NOT_STRING(_transformerOperators.default.SPLIT));
    }
    return left.split(right);
});
const esTemplateSetting = {
    interpolate: /\$\{([\s\S]+?)\}/g
};
_config.default.addTransformerToMap(OP_INTERPOLATE, (left, right)=>{
    if (typeof left !== 'string') {
        throw new Error(MSG.VALUE_NOT_STRING(_transformerOperators.default.INTERPOLATE));
    }
    if (right != null && typeof right !== 'object') {
        throw new Error(MSG.OPERAND_NOT_OBJECT(_transformerOperators.default.INTERPOLATE));
    }
    if (Array.isArray(right)) {
        if (right.length !== 2) {
            throw new Error(MSG.OPERAND_NOT_TUPLE(_transformerOperators.default.INTERPOLATE));
        }
        return (0, _utils.template)(left, right[0], right[1] === 'es6' ? esTemplateSetting : right[1]);
    }
    return (0, _utils.template)(left, right);
});
const _default = _transform.default;

//# sourceMappingURL=transformers.js.map