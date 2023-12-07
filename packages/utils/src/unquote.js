import replaceAll from './replaceAll';

/**
 * Unquote a string
 * @function string.unquote
 * @param {String} str
 * @param {boolean} [unescape=false] - True to unescape slashed quote, default false
 * @param {Set|Array} [quoteSet] - Set of chars
 * @returns {String}
 */
function unquote(str, unescape, quoteSet) {
    if (typeof str !== 'string') {
        return str;
    }

    if (str.length < 2) {
        return str;
    }

    let start = str[0];
    if (start !== str[str.length - 1]) {
        return str;
    }

    if (quoteSet) {
        if (Array.isArray(quoteSet)) {
            quoteSet = new Set(quoteSet);
        }

        if (!quoteSet.has(start)) {
            return str;
        }
    }

    str = str.slice(1, -1);

    if (unescape) {
        return replaceAll(str, '\\' + start, start);
    }

    return str;
}

export default unquote;
