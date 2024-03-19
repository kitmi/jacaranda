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
        object = Object.values(object);
    }

    if (index < 0) {
        index = object.length + index;
    }

    return object[index];
}

export default valueAt;
