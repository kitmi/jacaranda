import isPlainObject from './isPlainObject';

/**
 * Iterate a collection asynchronously until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findKeyAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate_
 * @returns {Promise.<Object|undefined>}
 */
async function findKeyAsync_(obj, asyncPredicate_) {
    if (Array.isArray(obj)) {
        let l = obj.length;
        for (let i = 0; i < l; i++) {
            const el = obj[i];
            if (await asyncPredicate_(el, i, obj)) {
                return i;
            }
        }

        return undefined;
    } else if (isPlainObject(obj)) {
        for (let k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (await asyncPredicate_(el, k, obj)) {
                    return k;
                }
            }
        }

        return undefined;
    }

    return Promise.reject('The first argument should be a collection.');
}

export default findKeyAsync_;
