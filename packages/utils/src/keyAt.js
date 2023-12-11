/**
 * Returns the key at the specified index of an object.
 * @param {Object} object
 * @param {integer} index
 * @returns {String|*}
 */
function keyAt(object, index) {
    return object == null ? undefined : Object.keys(object)[index ?? 0];
}

export default keyAt;
