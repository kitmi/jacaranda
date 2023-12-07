import isInteger from 'lodash/isInteger';

function toInteger(value) {
    if (isInteger(value)) return value;
    return parseInt(value);
}

export default toInteger;
