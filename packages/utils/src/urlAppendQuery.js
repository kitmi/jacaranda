import objectToQueryString from './urlObjectToQueryString';
import queryStringToObject from './urlQueryStringToObject';

/**
 * Merge the query parameters into given url.
 * @function string.urlAppendQuery
 * @param {String} url - Original url.
 * @param {Object} query - Key-value pairs query object to be merged into the url.
 * @returns {String}
 */
function appendQuery(url, query) {
    if (!query) {
        return url;
    }

    const posQM = url.indexOf('?');

    if (posQM === -1) {
        if (typeof query !== 'string') {
            query = objectToQueryString(query);
        }

        return query ? url + '?' + query : url;
    }

    const [base, qs] = url.split('?', 2);
    const previousObj = queryStringToObject(qs);
    const newObj = typeof query === 'string' ? queryStringToObject(query) : query;

    const newQs = objectToQueryString({ ...previousObj, ...newObj });

    return newQs ? base + '?' + newQs : url;
}

export default appendQuery;
