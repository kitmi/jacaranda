const regexInt = /^(\+|-)?\d+$/;
const regexPos = /^\+?[1-9]\d*$/;
const regexIndex = /^0$|^([1-9]\d*)$/;
const regexNeg = /^-[1-9]\d*$/;
const regexNonZero = /^(\+|-)?[1-9]\d*$/;

export const RANGE_ALL = 'all';
export const RANGE_POSITIVE = 'positive';
export const RANGE_NEGATIVE = 'negative';
export const RANGE_INDEX = 'index';
export const RANGE_NON_ZERO = 'nonZero';

const mapRegex = {
    [RANGE_ALL]: regexInt,
    [RANGE_POSITIVE]: regexPos,
    [RANGE_INDEX]: regexIndex,
    [RANGE_NEGATIVE]: regexNeg,
    [RANGE_NON_ZERO]: regexNonZero,
};

/**
 * Check a number or string whether it is exactly an integer
 * @param {*} value
 * @returns {boolean}
 */
const isInteger = (value, range = RANGE_ALL) => {
    const type = typeof value;

    if (type === 'number') {
        return Number.isInteger(value);
    } else if (type === 'string') {
        value = value.trim();

        const regex = mapRegex[range] || regexInt;
        if (regex.test(value)) {
            return true;
        }
    }

    return false;
};

export default isInteger;
