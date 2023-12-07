/**
 * One-by-one merge two arrays into one
 * 10x faster than lodash flatten and zip
 * @alias array.zipAndFlat
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {Array}
 */
function zipAndFlat(arr1, arr2) {
    let long,
        result = [],
        ll,
        ls;
    const l1 = arr1 == null ? 0 : arr1.length;
    const l2 = arr2 == null ? 0 : arr2.length;

    if (l2 > l1) {
        ll = l2;
        ls = l1;
        long = arr2;
    } else {
        ll = l1;
        ls = l2;
        long = arr1;
    }

    for (let i = 0; i < ls; i++) {
        result.push(arr1[i]);
        result.push(arr2[i]);
    }

    for (let i = ls; i < ll; i++) {
        result.push(long[i]);
    }

    return result;
}

export default zipAndFlat;
