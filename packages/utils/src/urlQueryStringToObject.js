/**
 * Parse query string into key-value pairs.
 * @function string.urlQueryStringToObject
 * @param {String} qs
 * @returns {Object}
 */
function queryStringToObject(qs) {
    if (!qs) {
        return {};
    }
    const query = qs[0] === '?' ? qs.substring(1) : qs;
    const parts = query.split('&');

    return parts.reduce((r, pair) => {
        const [k, v] = pair.split('=');
        r[decodeURIComponent(k)] = v == null ? null : decodeURIComponent(v);
        return r;
    }, {});
}

export default queryStringToObject;
