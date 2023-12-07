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
    RANGE_INDEX: function() {
        return RANGE_INDEX;
    },
    RANGE_NEGATIVE: function() {
        return RANGE_NEGATIVE;
    },
    RANGE_NON_ZERO: function() {
        return RANGE_NON_ZERO;
    },
    RANGE_POSITIVE: function() {
        return RANGE_POSITIVE;
    },
    default: function() {
        return _default;
    }
});
const regexInt = /^(\+|-)?\d+$/;
const regexPos = /^\+?[1-9]\d*$/;
const regexIndex = /^0$|^([1-9]\d*)$/;
const regexNeg = /^-[1-9]\d*$/;
const regexNonZero = /^(\+|-)?[1-9]\d*$/;
const RANGE_POSITIVE = 'positive';
const RANGE_NEGATIVE = 'negative';
const RANGE_INDEX = 'index';
const RANGE_NON_ZERO = 'nonZero';
const mapRegex = {
    [RANGE_POSITIVE]: regexPos,
    [RANGE_INDEX]: regexIndex,
    [RANGE_NEGATIVE]: regexNeg,
    [RANGE_NON_ZERO]: regexNonZero
};
/**
 * Check a number or string whether it is exactly an integer
 * @param {*} value
 * @returns {boolean}
 */ const isInteger = (value, options)=>{
    options = {
        range: 'all',
        ...options
    };
    const type = typeof value;
    if (type === 'number') {
        return Number.isInteger(value);
    } else if (type === 'string') {
        value = value.trim();
        const regex = mapRegex[options.range] || regexInt;
        if (regex.test(value)) {
            return true;
        }
    }
    return false;
};
const _default = isInteger;

//# sourceMappingURL=isInteger.js.map