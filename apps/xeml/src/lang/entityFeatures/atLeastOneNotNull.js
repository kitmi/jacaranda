"use strict";

const FEATURE_NAME = 'atLeastOneNotNull';

/**
 * A rule specifies at least one field not null, e.g. email or mobile.
 * @module EntityFeature_AtLeastOneNotNull
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {array} fields - List of field names
 */
function feature(entity, [ fields ]) {
    if (!fields) {
        throw new Error('Missing field names!');
    }

    Array.isArray(fields) || (fields = [ fields ]);

    entity.addFeature(FEATURE_NAME, fields, true).once('afterAddingFields', () => {
        fields.forEach(fieldName => {
            let field = entity.fields[fieldName];

            if (!field) {
                throw new Error('Required field "' + fieldName + '" not exist.');
            }

            field.optional = true;
        });
    });
}

module.exports = feature;