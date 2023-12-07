import _template from 'lodash/template';

const templateSettings = {
    escape: false,
    evaluate: false,
    imports: false,
    interpolate: /{{([\s\S]+?)}}/g,
    variable: false,
};

/**
 * @function string.compile
 * @param {String} str
 * @param {Object} [settings] - Template settings, {@link https://lodash.com/docs/4.17.15#template}
 * @returns {Template}
 */
const compile = (str, settings) => {
    return _template(str, settings ?? templateSettings);
};

export default compile;
