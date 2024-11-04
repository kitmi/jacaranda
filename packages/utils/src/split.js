/**
 * Split a string into two parts by the last occurance of a separator
 * @param {String} str
 * @param {String} separator
 * @returns {Array} [ String, String ]
 */
export const splitLast = (str, separator) => {
    const lastIndex = str.lastIndexOf(separator);
    return [
        lastIndex === -1 ? null : str.substring(0, lastIndex),
        lastIndex === -1 ? str : str.substring(lastIndex + separator.length),
    ];
};

/**
 * Split a string into two parts by the first occurance of a separator
 * @param {String} str
 * @param {String} separator
 * @returns {Array} [ String, String ]
 */
export const splitFirst = (str, separator) => {
    const index = str.indexOf(separator);
    return [
        index === -1 ? str : str.substring(0, index),
        index === -1 ? null : str.substring(index + separator.length),
    ];
};
