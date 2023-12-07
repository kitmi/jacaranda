/**
 * Ensure a string ends with *ending*
 * @function string.ensureEndsWith
 * @param {String} str
 * @param {String} ending
 * @returns {String}
 */
const ensureEndsWith = (str, ending) => (str ? (str.endsWith(ending) ? str : str + ending) : ending);

export default ensureEndsWith;
