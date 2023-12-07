import isPlainObject from './isPlainObject';

/**
 * Iterate an array of an object asynchronously
 * @alias collection.eachAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} iterator
 * @returns {Promise.<Array|Object>}
 */
async function eachAsync_(obj, iterator) {
    if (Array.isArray(obj)) {
        let r = [];

        let l = obj.length;
        for (let i = 0; i < l; i++) {
            r.push(await iterator(obj[i], i, obj));
        }

        return r;
    }

    if (isPlainObject(obj)) {
        let r = {};

        for (let k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                r[k] = await iterator(obj[k], k, obj);
            }
        }

        return r;
    }

    return Promise.reject('Invalid argument!');
}

export default eachAsync_;
