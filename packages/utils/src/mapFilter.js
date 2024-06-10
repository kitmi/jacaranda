import _reduce from 'lodash/reduce';

const mapFilterReducerArray = (predicate, mapper) => (result, value) => {
    if (predicate(value)) {
        result.push(mapper(value));
    }
    return result;
};

const mapFilterReducerObject = (predicate, mapper) => (result, value, key) => {
    if (predicate(value)) {
        result[key] = mapper(value);
    }
    return result;
};

/**
 * Map the filtered collection.
 * @param {object} collection
 * @param {function} filterPredicate
 * @param {function} mapper
 */
const mapFilter = (collection, filterPredicate, mapper) =>
    Array.isArray(collection)
        ? _reduce(collection, mapFilterReducerArray(filterPredicate, mapper), [])
        : _reduce(collection, mapFilterReducerObject(filterPredicate, mapper), {});

export default mapFilter;
