import _get from './get';
import _set from './set';

/**
 * Push an value into an array element of a collection
 * @alias object.pushIntoBucket
 * @param {Object} collection
 * @param {string} key
 * @param {Object} value
 * @param {boolean} [flattenArray=false] - Whether to flatten the array, if the given value is an array.
 * @returns {*} The modified bucket
 */
function pushIntoBucket(collection, key, value, flattenArray) {
    let bucket = _get(collection, key);

    if (Array.isArray(bucket)) {
        if (Array.isArray(value) && flattenArray) {
            bucket = bucket.concat(value);
            _set(collection, key, bucket);
        } else {
            bucket.push(value);
        }
    } else if (bucket == null) {
        bucket = Array.isArray(value) && flattenArray ? value.concat() : [value];
        _set(collection, key, bucket);
    } else {
        bucket = Array.isArray(value) && flattenArray ? [bucket, ...value] : [bucket, value];
        _set(collection, key, bucket);
    }

    return bucket;
}

export default pushIntoBucket;
