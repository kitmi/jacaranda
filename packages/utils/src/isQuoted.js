/**
 * Check a string if it is quoted with " or '
 * @function string.isQuoted
 * @param {String} s
 * @returns {boolean}
 */
const isQuoted = (s) => s && (s.startsWith("'") || s.startsWith('"')) && s[0] === s[s.length - 1];

export default isQuoted;
