/**
 * Check a variable whether is plain object.
 * 20x fasters than lodash
 * @alias object.isPlainObject
 * @param {*} any
 * @see [benchmark]{@link https://www.measurethat.net/Benchmarks/Show/11574/0/lodash-isplainobject-vs-js-constructor-check-with-more}
 */
const isPlainObject = (any) =>
    any != null && (any.constructor === Object || (typeof any === 'object' && Object.getPrototypeOf(any) === null));

export default isPlainObject;
