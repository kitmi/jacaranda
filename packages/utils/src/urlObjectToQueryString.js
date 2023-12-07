/**
 * Stringify an object into url query string.
 * @function string.urlObjectToQueryString
 * @param {Object} obj
 * @returns {String}
 */
function objectToQueryString(obj, excludeNullValue) {
    let parts = [];

    for (let k in obj) {
        const v = obj[k];
        let part;

        if (v != null) {
            part = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        } else if (excludeNullValue) {
            continue;
        } else {
            part = encodeURIComponent(k);
        }

        parts.push(part);
    }

    return parts.join('&');
}

export default objectToQueryString;
