import replaceAll from './replaceAll';

const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>',
};

/**
 * Unwrap a string
 * @function string.unwrap
 * @param {String} str
 * @param {String} [startToken] - Start token, default "
 * @param {String} [endToken] - End token, default "
 * @returns {String}
 */
function unwrap(str, startToken, endToken) {
    if (typeof str !== 'string') {
        return str;
    }

    if (str.length < 2) {
        return str;
    }

    if (startToken == null && endToken == null) {
        let start = str[0];
        let end = str[str.length - 1];
        const endToken2 = pairs[start];

        if (endToken2 == null || end !== endToken2) {
            return str;
        }

        return str.slice(1, -1);
    }

    if (endToken == null) {
        endToken = startToken;
    }

    if (str.startsWith(startToken) && str.endsWith(endToken)) {
        return str.slice(startToken.length, -endToken.length);
    }

    return str;
}

export default unwrap;
