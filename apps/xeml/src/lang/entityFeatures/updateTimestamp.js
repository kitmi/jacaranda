"use strict";

const FEATURE_NAME = 'updateTimestamp';

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeature_UpdateTimestamp
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {object} options - Field options
 */
function initialize(entity, args = []) {
    let typeInfo = {
        name: 'updatedAt',
        type: 'datetime',
        readOnly: true,
        forceUpdate: true,
        optional: true
    };

    let [ options ] = args;

    if (options) {
        if (typeof options === 'string') {
            options = { name: options };
        }

        Object.assign(typeInfo, options);
    }

    let fieldName = typeInfo.name;

    entity.addFeature(FEATURE_NAME, {
        field: fieldName
    }).once('afterAddingFields', () => {
        entity.addField(fieldName, typeInfo)
    });
}

module.exports = initialize;