import dropIfEndsWith from './dropIfEndsWith';
import ensureStartsWith from './ensureStartsWith';

/**
 * Join base url and the extra url path.
 * @function string.urlJoin
 * @param {String} base
 * @param {String} extraPath
 * @param {...any} more - More path
 * @returns {String}
 */
function join(base, extraPath, ...more) {
    if (more && more.length > 0) {
        return more.reduce((result, part) => join(result, part), join(base, extraPath));
    }

    return base ? (extraPath ? dropIfEndsWith(base, '/') + ensureStartsWith(extraPath, '/') : base) : extraPath;
}

export default join;
