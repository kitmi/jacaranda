import isPlainObject from './isPlainObject';

/**
 * Iterates over elements of collection asynchronously, returning an array of all elements predicate returns truthy for.
 * The predicate is invoked asynchronously with three arguments: (value, index|key, collection).
 * @alias collection.filterAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate
 * @returns {Promise.<Object|undefined>}
 */
async function filterAsync_(obj, asyncPredicate) {
    if (Array.isArray(obj)) {
        let r = [];
        let l = obj.length;
        for (let i = 0; i < l; i++) {
            const el = obj[i];
            if (await asyncPredicate(el, i, obj)) {
                r.push(el);
            }
        }

        return r;
    } else if (isPlainObject(obj)) {
        let r = {};
        for (let k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const el = obj[k];
                if (await asyncPredicate(el, k, obj)) {
                    r[k] = el;
                }
            }
        }

        return r;
    } 

    throw new Error('Invalid argument!');
}

export default filterAsync_;
