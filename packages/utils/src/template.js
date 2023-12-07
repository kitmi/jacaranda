import compile from './compile';

/**
 * Interpolate values
 * @function string.template
 * @param {String} str
 * @param {Object} values
 * @param {Object} [settings] - Template settings, {@link https://lodash.com/docs/4.17.15#template}
 * @returns {String}
 */
function template(str, values, settings) {
    return compile(str, settings)(values);
}

export default template;
