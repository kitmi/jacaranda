import _clone from 'lodash/clone';
import isInteger, { RANGE_INDEX } from './isInteger';

import { addEntry } from './set';

// copy on write set
function cowSet(collection, keyPath, value, options) {
    options = { numberAsArrayIndex: true, keyPathSeparator: '.', ...options };

    if (collection == null || typeof collection !== 'object') {
        return collection;
    }

    if (keyPath == null) {
        return collection;
    }

    let nodes = Array.isArray(keyPath) ? keyPath.concat() : keyPath.split(options.keyPathSeparator);
    const length = nodes.length;

    if (length > 0) {
        const lastIndex = length - 1;

        let index = 0;
        let nested = _clone(collection);
        collection = nested;

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

                nested = next;
            } else {
                nested[key] = _clone(next);
                nested = nested[key];
            }
        }

        const lastKey = nodes[lastIndex];
        addEntry(nested, lastKey, value, options.numberAsArrayIndex);
    }

    return collection;
}

export default cowSet;
