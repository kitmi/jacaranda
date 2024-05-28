"use strict";

const { naming } = require('@genx/july');

const FEATURE_NAME = 'stateTracking';

const FIELD_NAME_SUFFIX = 'Timestamp';

function timestampFieldNaming(field, state) {
    return field + naming.pascalCase(state) + FIELD_NAME_SUFFIX;
}

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeature_StateTracking
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {object} options - Tracking field options
 * @property {string} options.field - State field to track
 * @property {bool} [options.reversible=false] - Specify whether the field can be set to a previous state again
 */
function feature(entity, args = []) {
    let [ options ] = args;
    
    if (!options) {
        throw new Error('Missing field options!');
    }

    if (typeof options === 'string') {
        options = { field: options };
    }

    if (!options.field) {
        throw new Error('Missing field name in options!');
    }

    let stateSetTimestamp = {
        type: 'datetime',
        optional: true,
        auto: true
    };

    if (!options.reversible) {
        stateSetTimestamp.writeOnce = true;
    }

    entity.once('afterAddingFields', () => {
        if (!entity.hasField(options.field)) {
            throw new Error('Field "' + options.field + '" does not exist!');
        }

        let fieldInfo = entity.fields[options.field];

        if (fieldInfo.type !== 'enum') {
            throw new Error('Only enum field can be used with stateTracking feature!');
        }

        let stateMapping = {};

        fieldInfo.values.forEach(state => {
            let fieldName = timestampFieldNaming(options.field, state);

            entity.addField(fieldName, stateSetTimestamp);
            stateMapping[state] = fieldName;
        });

        entity.addFeature(FEATURE_NAME, {
            field: options.field,
            stateMapping
        }, true);
    });
}

module.exports = feature;