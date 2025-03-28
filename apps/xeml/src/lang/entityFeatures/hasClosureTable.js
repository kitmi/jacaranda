const FEATURE_NAME = 'hasClosureTable';

/**
 * Automatically create the self-referencing closure table record with depth being 0.
 * @module EntityFeature_HasClosureTable
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 */
function feature(entity, args = []) {
    let [closureTable, orderField] = args;

    if (closureTable == null) {
        throw new Error('Missing the associated closure table name.');
    }

    const closureTableEntity = entity.getReferencedEntity(closureTable);
    if (!closureTableEntity.baseClasses.find((base) => base.name === 'closureTable')) {
        throw new Error(
            `Entity "${closureTable}" referenced by "hasClosureTable" feature of "${entity.name}" is not a closure table.`
        );
    }

    const assocInfo = entity.info.associations.find(
        (a) => a.destEntity === closureTable && a.remoteField === 'ancestorId'
    );
    const reverseInfo = entity.info.associations.find(
        (a) => a.destEntity === closureTable && a.remoteField === 'descendantId'
    );

    entity.addFeature(FEATURE_NAME, {
        closureTable,
        relation: assocInfo.srcField,
        reverse: reverseInfo.srcField,
        orderField,
    });
}

module.exports = feature;
