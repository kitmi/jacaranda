import replaceAll from './replaceAll';

/**
 * Parse csv string into array, simple implementation especially for one-line parsing.
 * 23x faster than csv-parse for single line parsing
 * 10x faster than csv-parse/sync for single line parsing
 *
 * split + simpleCsvParser, however split('\n') is not good for massive data, should use stream reader instead
 * 5x faster than csv-parse/sync for multiple lines parsing
 *
 * @param {string} str
 * @param {object} [options]
 * @property {string} [options.delimiter=',']
 * @property {boolean} [options.emptyAsNull=false]
 * @returns {array}
 */
const simpleCsvParser = (str, options) => {
    const { delimiter, emptyAsNull } = { delimiter: ',', emptyAsNull: false, ...options };

    let inQuote = null;
    let start = 0;
    let result = [];
    let lastWord = null;
    let hasEscaped = false;

    const l = str.length;

    for (let i = 0; i < l; i++) {
        const ch = str[i];

        if (inQuote) {
            if (ch === inQuote) {
                if (str[i - 1] === '\\') {
                    hasEscaped = true;
                } else {
                    // not escaped
                    lastWord = str.substring(start, i);
                    if (lastWord && hasEscaped) {
                        lastWord = replaceAll(lastWord, '\\' + inQuote, inQuote);
                    }
                    inQuote = null;
                    hasEscaped = false;
                }
            }
        } else if (ch === delimiter) {
            if (lastWord == null && i > start) {
                lastWord = str.substring(start, i);
            }
            result.push(lastWord ? lastWord.trim() : emptyAsNull ? null : '');
            lastWord = null;
            hasEscaped = false;
            start = i + 1;
        } else if (ch === '"' || ch === "'") {
            if (lastWord == null) {
                inQuote = ch;
                start = i + 1;
            }
        }
    }

    if (lastWord == null) {
        lastWord = str.substring(start);
    }
    result.push(lastWord ? lastWord.trim() : emptyAsNull ? null : '');

    return result;
};

export default simpleCsvParser;
