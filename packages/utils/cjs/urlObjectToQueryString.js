/**
 * Stringify an object into url query string.
 * @function string.urlObjectToQueryString
 * @param {Object} obj
 * @returns {String}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function objectToQueryString(obj, excludeNullValue) {
    let parts = [];
    for(let k in obj){
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
const _default = objectToQueryString;

//# sourceMappingURL=urlObjectToQueryString.js.map