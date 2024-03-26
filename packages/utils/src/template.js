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

const esTemplateSetting = {
    escape: false,
    evaluate: false,
    imports: false,
    interpolate: /\$\{([\s\S]+?)\}/g,
    variable: false,
};

export const esTemplate = (str, values) => template(str, values, esTemplateSetting);

export default template;
