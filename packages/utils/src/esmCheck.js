/**
 * Check whether the object is an ES module, if yes, return the default export.
 * @param {*} obj
 * @returns {*}
 */
const esmCheck = (obj) => {
    if (obj.__esModule && typeof obj.default !== 'undefined') {
        return obj.default;
    }

    return obj;
};

export default esmCheck;
