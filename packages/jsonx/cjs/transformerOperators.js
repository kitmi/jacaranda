//Query & aggregate operators (pure)
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
const SIZE = 'size';
const SUM = 'sum';
const GET_TYPE = 'typeof';
const MATCH = 'validate';
const GET_BY_INDEX = 'byIndex';
const GET_BY_KEY = 'byKey';
const FIND_INDEX = 'findIndex';
const FIND = 'find';
const IF = 'if';
//Type casting operators (pure)
const CAST_ARRAY = 'castArray';
//Math operators (pure)
const ADD = 'add';
const SUB = 'sub';
const MUL = 'mul';
const DIV = 'div';
const MOD = 'mod';
//Collection operators (pure)
const KEYS = 'keys';
const VALUES = 'values';
const ENTRIES = 'pairs';
const OBJ_TO_ARRAY = 'toArray'; // like $objectToArray of mongodb
const FILTER_NULL = 'xNull';
const PICK = 'pick'; // filter by key
const OMIT = 'omit';
const SLICE = 'slice'; // limit offset, count
const GROUP = 'groupBy';
const SORT = 'orderBy';
const REVERSE = 'reverse';
const JOIN = 'join';
const MERGE = 'merge';
const FILTER = 'filterBy'; // filter by value
const REMAP = 'remap'; // map a key to another name
const TO_JSON = 'stringfy';
const TO_OBJ = 'parse';
//Value updater (pure, copy on write)
const SET = 'set';
const ADD_ITEM = 'addItem';
const ASSIGN = 'assign';
const APPLY = 'apply';
const SANITIZE = 'sanitize';
const SPLIT = 'split';
const INTERPOLATE = 'interpolate';
//Colllection modifier
const MAP = 'map';
const REDUCE = 'reduce';
const _default = {
    SIZE,
    SUM,
    GET_TYPE,
    MATCH,
    GET_BY_INDEX,
    GET_BY_KEY,
    FIND_INDEX,
    FIND,
    IF,
    CAST_ARRAY,
    ADD,
    SUB,
    MUL,
    DIV,
    MOD,
    KEYS,
    VALUES,
    ENTRIES,
    OBJ_TO_ARRAY,
    FILTER_NULL,
    PICK,
    OMIT,
    SLICE,
    GROUP,
    SORT,
    REVERSE,
    JOIN,
    MERGE,
    FILTER,
    REMAP,
    TO_JSON,
    TO_OBJ,
    SET,
    ADD_ITEM,
    ASSIGN,
    APPLY,
    SANITIZE,
    SPLIT,
    INTERPOLATE,
    MAP,
    REDUCE
};

//# sourceMappingURL=transformerOperators.js.map