import _upperFirst from 'lodash/upperFirst';
import _camelCase from 'lodash/camelCase';

/**
 * Convert a string to pascal case, 'fooBar'
 * @function string.pascalCase
 * @param {String} str
 * @returns {String}
 */
const pascalCase = (str) => _upperFirst(_camelCase(str));

export default pascalCase;
