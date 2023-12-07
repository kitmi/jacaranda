import replaceAll from './replaceAll';

/**
 * Quote a string.
 * @function string.quote
 * @param {String} str
 * @param {String} [quoteChar=']
 * @returns {String}
 */
function quote(str, quoteChar = '"') {
    return quoteChar + replaceAll(str, quoteChar, '\\' + quoteChar) + quoteChar;
}

export default quote;
