const FEATURE_NAME = 'createTimestamp';

/**
 * A rule specifies the entity to automatically record the creation time
 * @module EntityFeature_CreateTimestamp
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {array} options - Field options
 */
function feature(entity, args = []) {
    let typeInfo = {
        name: 'createdAt',
        type: 'datetime',
        auto: true,
        readOnly: true,
        writeOnce: true,
    };

    let [options] = args;

    if (options) {
        if (typeof options === 'string') {
            options = { name: options };
        }

        Object.assign(typeInfo, options);
    }

    const fieldName = typeInfo.name;
    const featureInfo = {
        field: fieldName,
    };

    entity.addFeature(FEATURE_NAME, featureInfo).once('afterAddingFields', () => {
        entity.addField(fieldName, typeInfo);
    });
}

module.exports = feature;
