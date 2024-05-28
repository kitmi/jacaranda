/**
 * Check a string if it is started and ended with a given sub-string
 * @function string.isWrappedWith
 * @param {String} s - String to check
 * @param {String} q - Sub-srting
 * @returns {boolean}
 */
const isWrappedWith = (s, q1, q2) => {
    q2 = q2 || q1;
    return s && q1 && s.length > q1.length && s.startsWith(q1) && s.endsWith(q2);
};

export default isWrappedWith;
