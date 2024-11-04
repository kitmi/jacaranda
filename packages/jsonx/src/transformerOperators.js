//Query & aggregate operators (pure)
const SIZE = 'size';
const SUM = 'sum';
const GET_TYPE = 'typeof';

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
const POW = 'pow';

//Collection operators (pure)
const KEYS = 'keys';
const VALUES = 'values';
const ENTRIES = 'pairs';
const OBJ_TO_ARRAY = 'toArray'; // like $objectToArray of mongodb
const FILTER_NULL = 'xNull';
const PICK = 'pick'; // filter by key
const PICK_VALUES = 'pickValues'; // filter by key
const OMIT = 'omit';
const SLICE = 'slice'; // limit offset, count
const GROUP = 'groupBy';
const SORT = 'orderBy';
const REVERSE = 'reverse';
const CONCAT = 'concat';
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
const CREATE = 'create';
const APPLY = 'apply';
const SANITIZE = 'sanitize';
const SPLIT = 'split';
const INTERPOLATE = 'interpolate';

export default {
    SIZE,
    SUM,
    GET_TYPE,
    FIND_INDEX,
    FIND,
    IF,

    CAST_ARRAY,

    ADD,
    SUB,
    MUL,
    DIV,
    MOD,
    POW,

    KEYS,
    VALUES,
    ENTRIES,
    OBJ_TO_ARRAY,
    FILTER_NULL,
    PICK, // filter by key
    PICK_VALUES,
    OMIT,
    SLICE,
    GROUP,
    SORT,
    REVERSE,
    CONCAT,
    JOIN,
    MERGE,
    FILTER, // filter by value
    REMAP, // map a key to another name
    TO_JSON,
    TO_OBJ,

    SET,
    ADD_ITEM,
    ASSIGN,
    CREATE,
    APPLY,
    SANITIZE,
    SPLIT,
    INTERPOLATE,
};
