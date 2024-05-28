"use strict";

const { _, isPlainObject } = require('@genx/july')
const FEATURE_NAME = 'i18n';

/**
 * A rule specifies internationalization.
 * @module EntityFeature_I18n
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {object} options - Tracking field options 
 * 
 * 1. add locale suffix to field
 * 2. set a default locale
 * 3. if query with default locale, fallback to the field without suffix
 * 
 */
function feature(entity, args = []) {
    let [ options ] = args;
    
    if (!options) {
        throw new Error('Missing feature options!');
    }

    const [ field, locales ] = options;

    if (!field) {
        throw new Error('Missing field name in options!');
    }

    if (!locales) {
        throw new Error('Missing locale mapping in options!');
    }

    if (!isPlainObject(options.locales)) {
        throw new Error('Invalid locale mapping. Plain object expected!');
    }

    entity.addFeature(FEATURE_NAME, options, true).once('afterAddingFields', () => {
        if (!entity.hasField(field)) {
            throw new Error('Field "' + field + '" does not exist!');
        }

        let fieldInfo = entity.fields[field];
        let suffixSet = new Set(Object.values(locales));

        for (let suffix of suffixSet) {
            if (suffix === 'default') continue;

            let fieldName = options.field + '_' + suffix;
            entity.addField(fieldName, fieldInfo);
        }
    });

}

module.exports = feature;