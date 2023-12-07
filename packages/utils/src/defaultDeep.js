import filterNull from './filterNull';

/**
 * Fallback to default value according to the sequence of sources, if the value of a key in all sources is null or undefined.
 * @param {object} obj - immutable object.
 * @param  {...object} sources
 * @returns {object} Merged object.
 */
function defaultDeep(obj, ...sources) {
    return [...sources.reverse(), obj].reduce((merged, newSource) => ({ ...merged, ...filterNull(newSource) }), {});
}

export default defaultDeep;
