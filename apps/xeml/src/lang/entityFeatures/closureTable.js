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
    let [ closureTable ] = args;

    if (closureTable == null) {
        throw new Error('Missing the associated closure table name.');
    }

    entity.addFeature(FEATURE_NAME, { entity: closureTable });
    entity.addFeature('createAfter', { relation: closureTable, initData: {
        ancestorId: {
            $xr: 'ObjectReference',
            name: 'latest.id'
        },
        descendantId: entity.name,
        depth: 0
    }  });
}

module.exports = feature;