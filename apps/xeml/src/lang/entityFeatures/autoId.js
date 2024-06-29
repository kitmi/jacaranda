const { _ } = require('@kitmi/utils');

const FEATURE_NAME = 'autoId';

/**
 * A rule specifies the id of entity is automatically generated.
 * @module EntityFeature_AutoId
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 * @param {array} options - Auto id field options
 * @property {string} [options.name='id'] - Field name
 * @property {string} [options.type='integer'] - Field type
 */
function feature(entity, args = []) {
    let typeInfo = {
        name: 'id',
        type: 'integer',
        auto: true,
        writeOnce: true,
    };

    let [options] = args;

    let featureExtra = {};

    if (options) {
        if (typeof options === 'string') {
            options = { name: options };
        }

        if (options.type) {
            switch (options.type) {
                case 'bigint':
                case 'integer':
                    if (options.startFrom) {
                        featureExtra.startFrom = options.startFrom;
                    }
                    break;

                case 'uuid':
                    typeInfo['type'] = 'text';
                    typeInfo['fixedLength'] = 36;
                    break;

                default:
                    throw new Error(`Unsupported autoId type: ${options.type}. Entity: ${entity.name}`);
            }
        } else {
            if (options.startFrom) {
                featureExtra.startFrom = options.startFrom;
            }
        }

        if (options.name) {
            typeInfo.name = options.name;
        }
    }

    let fieldName = typeInfo.name;
    const featureInfo = {
        field: fieldName,
        ...featureExtra,
    };

    entity.addFeature(FEATURE_NAME, featureInfo).once('beforeAddingFields', () => {
        entity.addField(fieldName, typeInfo).setKey(fieldName);
    });
}

module.exports = feature;
