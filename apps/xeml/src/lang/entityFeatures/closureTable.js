const FEATURE_NAME = 'closureTable';

/**
 * Automatically create the self-referencing closure table record with depth being 0.
 * @module EntityFeature_ClosureTable
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 */
function feature(entity, args = []) {
    let [ options ] = args;

    if (options == null) {
        throw new Error('Missing the associated closure table name.');
    }

    options = { entity: options };

    entity.addFeature(FEATURE_NAME, options);
}

module.exports = feature;