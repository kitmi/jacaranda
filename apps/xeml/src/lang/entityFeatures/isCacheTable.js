const FEATURE_NAME = 'isCacheTable';

/**
 * Cache table feature
 * @module EntityFeature_IsCacheTable
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 */
function feature(entity, args = []) {
    let [autoExpiry] = args;

    entity.addFeature(FEATURE_NAME, { autoExpiry });
}

module.exports = feature;
