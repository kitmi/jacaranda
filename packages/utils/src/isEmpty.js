import isTypedArray from './isTypedArray';

function isEmpty(value) {
    if (value == null) {
        return true;
    }

    const type = typeof value;

    if (type === 'string') return value.length === 0;

    if (type === 'object') {
        if (
            Array.isArray(value) ||
            Buffer.isBuffer(value) ||
            isTypedArray(value) ||
            value.toString() === '[object Arguments]'
        ) {
            return value.length === 0;
        }

        if (value instanceof Map || value instanceof Set) {
            return value.size === 0;
        }

        return Object.keys(value).length === 0 && Object.getOwnPropertySymbols(value).length === 0;
    }

    return false;
}

export default isEmpty;
