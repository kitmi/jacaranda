import _each from 'lodash/each';

/**
 * Convert a hierachy object into a flat object with the key path sperarated by a given string, default as ".".
 * @param {*} object
 * @param {*} keyPathSep
 * @returns {object}
 */
const flattenObject = (object, keyPathSep = '.') => {
    const result = {};

    _each(object, (v, k) => {
        k = k.toString();

        if (v != null && typeof v === 'object') {
            v = flattenObject(v, keyPathSep);
            _each(v, (v2, k2) => {
                k2 = k2.toString();
                result[k + keyPathSep + k2] = v2;
            });
        } else {
            result[k] = v;
        }
    });

    return result;
};

export default flattenObject;
