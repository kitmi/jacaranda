/**
 * Replace all occurance of "search" with "replacement" in a string.
 * 3.5x faster than String.replaceAll
 * @function string.replaceAll
 * @param {String} str
 * @param {String} search
 * @param {String} replacement
 * @see [benchmark]{@link https://www.measurethat.net/Benchmarks/Show/11267/0/string-replace-all}
 */
const replaceAll = (str, search, replacement) => str && str.split(search).join(replacement);

export default replaceAll;
