import isPlainObject from './isPlainObject';

/**
 * Iterate a collection until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findKey
 * @param {Array|Object} obj
 * @param {iterator} predicate
 * @returns {Promise.<Object|undefined>}
 */
function findKey(obj, predicate) {
    if (Array.isArray(obj)) {
        let l = obj.length;
        for (let i = 0; i < l; i++) {
            const el = obj[i];
            if (predicate(el, i, obj)) {
                return i;
            }
        }

        return undefined;
    } else if (isPlainObject(obj)) {
        for (let k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (predicate(el, k, obj)) {
                    return k;
                }
            }
        }

        return undefined;
    }

    throw new Error('The first argument should be a collection.');
}

export default findKey;
