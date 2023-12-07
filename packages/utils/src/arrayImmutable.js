/**
 * Move a value in an array-like object as a new copy.
 * @function array.move
 * @param {*} array 
 * @param {*} from 
 * @param {*} to 
 * @returns {Array}
 */
export const move = (array, from, to) => {
    const copy = copyArrayLike(array);
    if (from === to) {
        return copy;
    }

    const value = copy[from];
    copy.splice(from, 1);
    copy.splice(to, 0, value);
    return copy;
};

/**
 * Swap two values in an array-like object as a new copy.
 * @function array.swap
 * @param {*} arrayLike 
 * @param {integer} indexA 
 * @param {integer} indexB 
 * @returns {Array}
 */
export const swap = (arrayLike, indexA, indexB) => {
    const copy = copyArrayLike(arrayLike);
    if (indexA === indexB) {
        return copy;
    }
    const a = copy[indexA];
    copy[indexA] = copy[indexB];
    copy[indexB] = a;
    return copy;
};

/**
 * Insert a value into an array-like object as a new copy.
 * @function array.insert
 * @param {*} arrayLike 
 * @param {integer} index 
 * @param {*} value 
 * @returns {Array}
 */
export const insert = (arrayLike, index, value) => {
    const copy = copyArrayLike(arrayLike);
    copy.splice(index, 0, value);
    return copy;
};

/**
 * Copy an array-like object to an array, return an empty array if the argument is null or undefined.
 * @function array.copyArrayLike
 * @param {*} arrayLike 
 * @returns {Array}
 */
export const copyArrayLike = (arrayLike) => {
    if (!arrayLike) {
        return [];
    } else {
        return [...arrayLike];
    }
};

/**
 * Push a value into an array-like object if the value is not in the array-like object.
 * @function array.uniqPush
 * @param {*} arrayLike 
 * @param {*} value 
 * @returns {Array}
 */
export const uniqPush = (arrayLike, value) => {
    if (!arrayLike.includes(value)) {
        return [...arrayLike, value];
    }

    return arrayLike;
};
