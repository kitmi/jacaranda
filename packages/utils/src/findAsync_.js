import findKeyAsync_ from './findKeyAsync_';

/**
 * Iterate a collection asynchronously until predicate returns true
 * The returned value is undefined if not found.
 * That's different from the _.find() function in lodash.
 * @alias collection.findAsync_
 * @async
 * @param {Array|Object} obj
 * @param {asyncIterator} asyncPredicate_
 * @returns {Promise.<Object|undefined>}
 */
async function findAsync_(obj, asyncPredicate_) {
    const k = await findKeyAsync_(obj, asyncPredicate_);
    return obj[k];
}

export default findAsync_;
