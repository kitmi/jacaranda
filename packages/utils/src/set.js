import isPlainObject from './isPlainObject';
import _each from 'lodash/each';
import isInteger, { RANGE_INDEX } from './isInteger';

// attention: since mobx will wrap the object in a Proxy, the source value will be different from the wrapped one
// Here must return the obj[index] of obj[key], otherwise the child node will not be mounted to the root object

export const addEntry = (obj, key, value, numberAsArrayIndex) => {
    if (numberAsArrayIndex && isInteger(key, { range: RANGE_INDEX })) {
        if (Array.isArray(obj)) {
            const index = parseInt(key, 10);

            if (obj.length <= index) {
                const numToFill = index - obj.length;
                if (numToFill > 0) {
                    for (let i = 0; i < numToFill; i++) {
                        obj.push(undefined);
                    }
                }

                obj.push(value);
            } else {
                obj[index] = value;
            }

            return obj[index];
        }
    }

    obj[key] = value;
    return obj[key];
};

/**
 * Set a value by dot-separated path or key array into a collection
 * Does not support '[i]', e.g. 'a[0].b.c' style accessor, use [ 'a',  0, 'b', 'c' ] instead, different from lodash/set
 * @alias  object.set
 * @param {Object} collection - The collection
 * @param {string} keyPath - A dot-separated path (dsp) or a key array, e.g. settings.xxx.yyy, or ['setting', 'xxx', 'yyy']
 * @param {Object} value - The default value if the path does not exist
 * @returns {*}
 */
const _set = (collection, keyPath, value, options) => {
    options = { numberAsArrayIndex: true, keyPathSeparator: '.', ...options };

    if (collection == null || typeof collection !== 'object') {
        return collection;
    }

    if (keyPath == null) {
        return collection;
    }

    if (isPlainObject(keyPath) && typeof value === 'undefined') {
        // extract all key value pair and set
        _each(keyPath, (v, k) => _set(collection, k, v, options));
        return collection;
    }

    // break the path into nodes array
    let nodes = Array.isArray(keyPath) ? keyPath.concat() : keyPath.split(options.keyPathSeparator);
    const length = nodes.length;

    if (length > 0) {
        const lastIndex = length - 1;

        let index = 0;
        let nested = collection;

        while (nested != null && index < lastIndex) {
            const key = nodes[index++];

            let next = nested[key];
            if (next == null || typeof next !== 'object') {
                // peek next node, see if it is integer
                const nextKey = nodes[index];

                if (options.numberAsArrayIndex && isInteger(nextKey, { range: RANGE_INDEX })) {
                    next = addEntry(nested, key, [], options.numberAsArrayIndex);
                } else {
                    next = addEntry(nested, key, {}, options.numberAsArrayIndex);
                }
            }

            nested = next;
        }

        const lastKey = nodes[lastIndex];
        addEntry(nested, lastKey, value, options.numberAsArrayIndex);
    }

    return collection;
};

export default _set;
