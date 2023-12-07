/**
 * Check a string if it is started and ended with a given sub-string
 * @function string.isWrappedWith
 * @param {String} s - String to check
 * @param {String} q - Sub-srting
 * @returns {boolean}
 */
const isWrappedWith = (s, q) => s && q && s.length > q.length && s.startsWith(q) && s.endsWith(q);

export default isWrappedWith;
