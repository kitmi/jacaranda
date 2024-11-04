import isTypedArray from './isTypedArray';

/**
 * Get the size of a collection.
 * Note: lodash's size does not check symbol properties and will return unicode length for strings.
 * @param {*} collection
 * @returns {number}
 */
function size(collection) {
    if (collection == null) {
        return 0;
    }

    const type = typeof collection;

    if (type === 'string') return collection.length;

    if (type === 'object') {
        if (
            Array.isArray(collection) ||
            Buffer.isBuffer(collection) ||
            isTypedArray(collection) ||
            collection.toString() === '[object Arguments]'
        ) {
            return collection.length;
        }

        if (collection instanceof Map || collection instanceof Set) {
            return collection.size;
        }

        if (collection instanceof DataView) {
            return collection.byteLength;
        }

        return Object.keys(collection).length + Object.getOwnPropertySymbols(collection).length;
    }

    return 0;
}

export default size;
