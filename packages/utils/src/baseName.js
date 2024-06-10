/**
 * Get basename with or without path.
 * @param {string} str - Path
 * @param {boolean} includePath - Include path in the result.
 * @returns {string}
 */
const baseName = (str, includePath) => {
    const pos = str.lastIndexOf('.');
    let pathname = pos === -1 ? str : str.substring(0, pos);

    if (includePath) {
        return pathname;
    }

    pathname = pathname.replace(/\\/g, '/');
    return pathname.substring(pathname.lastIndexOf('/') + 1);
};

export default baseName;
