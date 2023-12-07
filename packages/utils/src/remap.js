import _each from 'lodash/each';

/**
 * Remap the keys of object elements in an array, like projection.
 * @alias object.remap
 * @param {*} object
 * @param {Object} mapping - key to newKey or key to array[ newKey, valueMap ] for next level mapping
 * @param {boolean} keepUnmapped - If true, will keep those not in mapping as its original key, otherwise filter out
 * @returns {Object} Remapped object
 */
function remap(object, mapping, keepUnmapped) {
    if (typeof mapping === 'string') return { [mapping]: object };

    let newObj = {};
    _each(object, (v, k) => {
        /* eslint-disable no-prototype-builtins */
        if (mapping.hasOwnProperty(k)) {
            /* eslint-enable no-prototype-builtins */
            let nk = mapping[k];
            if (Array.isArray(nk)) {
                newObj[nk[0]] = {
                    ...newObj[nk[0]],
                    ...remap(v, nk[1], keepUnmapped),
                };
            } else {
                newObj[nk] = v;
            }
        } else {
            if (keepUnmapped) {
                newObj[k] = v;
            }
        }
    });

    return newObj;
}

export default remap;
