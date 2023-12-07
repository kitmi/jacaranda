/**
 * Convert an array into a k-v paired object.
 * @alias array.arrayToObject
 * @param {*} arrayOfObjects
 * @param {*} keyGetter
 * @param {*} valueGetter
 * @returns {Object}
 */
const arrayToObject = (arrayOfObjects, keyGetter, valueGetter) => {
    if (arrayOfObjects == null) {
        return null;
    }

    if (!Array.isArray(arrayOfObjects)) {
        throw new Error('The target argument should be an array.');
    }

    const _keyGetter = typeof keyGetter === 'function' ? keyGetter : (obj) => obj[keyGetter];

    const _valueGetter =
        valueGetter == null
            ? (obj) => obj
            : typeof valueGetter === 'function'
            ? valueGetter
            : (obj) => obj[valueGetter];

    return arrayOfObjects.reduce((table, obj, index) => {
        table[_keyGetter(obj, index)] = _valueGetter(obj, index);
        return table;
    }, {});
};

export default arrayToObject;
