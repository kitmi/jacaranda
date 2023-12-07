/**
 * Ensure a string starts with *starting*
 * @function string.ensureStartsWith
 * @param {String} str
 * @param {String} starting
 * @returns {String}
 */
const ensureStartsWith = (str, starting) => (str ? (str.startsWith(starting) ? str : starting + str) : starting);

export default ensureStartsWith;
