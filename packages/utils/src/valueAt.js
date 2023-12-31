import isPlainObject from './isPlainObject';

/**
 * Returns the value at the specified index of an array|object|string.
 * @param {*} object
 * @param {integer} index
 * @returns {*}
 */
function valueAt(object, index) {
    if (object == null) {
        return undefined;
    }

    index ??= 0;

    if (isPlainObject(object)) {
        return Object.values(object)[index];
    }

    return object[index];
}

export default valueAt;
