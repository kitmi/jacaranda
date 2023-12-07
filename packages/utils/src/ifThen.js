/**
 * Shortcut function for returning an alternative value if predicate returns true
 * @alias lang.ifThen
 * @param {*} obj
 * @param {*} predicate
 * @param {*} then
 * @returns {*} Returns *then* if predicate(obj) is true, otherwise returns the original obj
 */
const ifThen = (obj, predicate, then) => (predicate(obj) ? then : obj);

export default ifThen;
