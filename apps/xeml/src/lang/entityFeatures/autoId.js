"use strict";

const { _ } = require('@genx/july');

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
        writeOnce: true
    };

    let [ options ] = args;

    let featureExtra = {};

    if (options) {
        if (typeof options === 'string') {
            options = { name: options };
        }        

        if (options.type) {
            switch (options.type) {
                case 'integer':
                    if (options.startFrom) {
                        featureExtra.startFrom = options.startFrom;
                    }
                break;

                case 'uuid':
                    typeInfo['type'] = 'text';
                    typeInfo['fixedLength'] = 36;
                    typeInfo['generator'] = 'uuid';
                break;

                case 'shortid':
                    typeInfo['type'] = 'text';
                    typeInfo['maxLength'] = 20;
                    typeInfo['generator'] = 'shortid';
                break;

                case 'uniqid':
                    typeInfo['type'] = 'text';                    

                    if (options.prefix) {
                        if (typeof options.prefix !== 'string') {
                            throw new Error(`"prefix" option should be a string. Entity: ${entity.name}, feature: autoId`);
                        }    

                        typeInfo['fixedLength'] = 17 + options.prefix.length;
                        typeInfo['generator'] = [ 'uniqid', options.prefix ];
                    } else {
                        typeInfo['fixedLength'] = 17;
                        typeInfo['generator'] = 'uniqid';
                    }                    
                break;

                case 'hyperid':
                    typeInfo['type'] = 'text';                                           

                    let args = [ 'hyperid' ];
                    let opt = {};
                    let prefixLength;

                    if (options.prefix) {
                        prefixLength = options.prefix.length;
                        opt.prefix = options.prefix;
                    } else {
                        prefixLength = 0;
                    }

                    if (options.fixedLength) {
                        opt.fixedLength = options.fixedLength;
                        typeInfo['fixedLength'] = 33 + prefixLength;
                    } else {
                        typeInfo['maxLength'] = 40 + prefixLength;
                    }

                    if (options.urlSafe) {
                        opt.urlSafe = options.urlSafe;
                    }

                    if (!_.isEmpty(opt)) {
                        args.push(opt);
                    }

                    typeInfo['generator'] = args.length > 1 ? args : args[0];
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

    entity.addFeature(FEATURE_NAME, {
        field: fieldName,
        ...featureExtra        
    }).once('beforeAddingFields', () => {
        entity.addField(fieldName, typeInfo)
            .setKey(fieldName);
    });
}

module.exports = feature;