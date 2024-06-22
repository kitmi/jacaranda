const EventEmitter = require('node:events');
const path = require('node:path');

const { _, isPlainObject, isEmpty } = require('@kitmi/utils');
const { generateDisplayName, deepCloneField, Clonable, entityNaming } = require('./XemlUtils');
const { FunctionalQualifiers } = require('./Rules');
const Field = require('./Field');

/**
 * Entity event listener
 * @callback Entity.eventListener
 * returns {*}
 */

/**
 * Geml entity
 * @class Entity
 */
class Entity extends Clonable {
    static overrideEntityMeta(sourceInfo, overrideInfo) {
        if (overrideInfo.features) {
            sourceInfo.features = [...(sourceInfo.features ?? []), ...overrideInfo.features];
        }

        if (overrideInfo.fields) {
            sourceInfo.fields = {
                ...sourceInfo.fields,
                ...overrideInfo.fields,
            };
        }

        if (overrideInfo.associations) {
            sourceInfo.associations = [...(sourceInfo.associations ?? []), ...overrideInfo.associations];
        }

        if (overrideInfo.indexes) {
            sourceInfo.indexes = [...(sourceInfo.indexes ?? []), ...overrideInfo.indexes];
        }

        if (overrideInfo.inputs) {
            sourceInfo.inputs = {
                ...sourceInfo.inputs,
                ...overrideInfo.inputs,
            };
        }

        if (overrideInfo.views) {
            sourceInfo.views = {
                ...sourceInfo.views,
                ...overrideInfo.views,
            };
        }
    }

    /**
     * Fields of the entity, map of <fieldName, fieldObject>
     * @member {object.<string, Field>}
     */
    fields = {};

    /**
     * Referenced types
     */
    types = {};

    /**
     * @param {Linker} linker
     * @param {string} name
     * @param {*} xemlModule
     * @param {object} info
     */
    constructor(linker, name, xemlModule, info) {
        super();

        this._events = new EventEmitter();

        /**
         * Linker to process this entity
         * @member {Linker}
         */
        this.linker = linker;

        /**
         * Name of this entity
         * @member {string}
         */
        this.name = entityNaming(name);

        /**
         * Owner geml module
         * @member {object}
         */
        this.xemlModule = xemlModule;

        /**
         * Raw metadata
         * @member {Object}
         */
        this.info = info;
    }

    /**
     * Listen on an event
     * @param {string} eventName
     * @param {Entity.eventListener} listener
     * @returns {EventEmitter}
     */
    once(eventName, listener) {
        return this._events.once(eventName, listener);
    }

    /**
     * Start linking this entity
     * @returns {Entity}
     */
    link() {
        pre: !this.linked;

        //1.inherit from base entity if any
        //2.initialize features
        //3.add fields
        //4.api

        //indexes will processed after processing foreign relationship

        this.linker.log('debug', 'Linking entity [' + this.name + '] ...');

        if (this.info.code) {
            this.code = this.info.code || this.name;
        }

        if (this.info.base) {
            //inherit fields, processed features, key and indexes
            let baseClasses = _.castArray(this.info.base);
            baseClasses.reverse().forEach((base) => {
                let baseEntity;

                if (isPlainObject(base)) {
                    baseEntity = this.linker.loadEntityTemplate(this.xemlModule, base.name, base.args);
                } else {
                    baseEntity = this.linker.loadEntity(this.xemlModule, base);
                }

                if (!baseEntity.linked) {
                    throw new Error(`Entity [${baseEntity.name}] is not linked when is inherited.`)
                }

                this._inherit(baseEntity);
            });

            this.baseClasses = baseClasses;
        }

        if (this.info.comment) {
            /**
             * @member {string}
             */
            this.comment = this.info.comment;
        }

        /**
         * @member {string}
         */
        this.displayName = generateDisplayName(this.name);

        /**
         * @fires Entity#featuresMixingIn
         */
        this._events.emit('featuresMixingIn');

        // load features
        if (this.info.features) {
            this.info.features.forEach((feature) => {
                let featureName;

                if (typeof feature === 'string') {
                    featureName = feature;
                } else {
                    featureName = feature.name;
                }

                let fn;

                try {
                    fn = require(path.resolve(__dirname, `./entityFeatures/${featureName}.js`));
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        throw new Error(`Unknown feature "${featureName}" reference in entity "${this.name}"`);
                    }
                }
                fn(this, this.linker.translateXemlValue(this.xemlModule, feature.args));
            });
        }

        /**
         * @fires Entity#beforeAddingFields
         */
        this._events.emit('beforeAddingFields');

        // process fields
        if (this.info.fields) {
            _.each(this.info.fields, (fieldInfo, fieldName) => this.addField(fieldName, fieldInfo));
        }

        /**
         * @fires Entity#afterAddingFields
         */
        this._events.emit('afterAddingFields');

        if (this.info.key) {
            this.key = this.info.key;

            if (Array.isArray(this.key) && this.key.length === 1) {
                this.key = this.key[0];
            }
        }

        if (this.info.inputs) {
            this.inputs = this.info.inputs;
        }

        if (this.info.views) {
            this.views = this.info.views;
        }

        /**
         * @fires Entity#beforeAddingInterfaces
         */
        this._events.emit('beforeAddingInterfaces');

        if (!isEmpty(this.info.interfaces)) {
            this.interfaces = _.cloneDeep(this.info.interfaces);

            _.forOwn(this.interfaces, (intf) => {
                if (!isEmpty(intf.accept)) {
                    intf.accept = _.map(intf.accept, (param) => {
                        const [typeInfo, baseInfo] = this.linker.trackBackType(this.xemlModule, param);
                        if (baseInfo != null) {
                            this.addUsedType(param.type, baseInfo.xemlModule.id);
                        }
                        return typeInfo;
                    });
                }
            });
        }

        /**
         * @fires Entity#afterAddingInterfaces
         */
        this._events.emit('afterAddingInterfaces');

        this.linked = true;

        return this;
    }

    addUsedType(type, typeLocation) {
        const existing = this.types[type];
        if (existing == null) {
            this.types[type] = typeLocation;
        } else {
            if (existing !== typeLocation) {
                //should never happen
                throw new Error('Different used types appear in the same entity!');
            }
        }
    }

    /**
     * Check whether the entity has an index on the given fields
     * @param {array} fields
     * @returns {boolean}
     */
    hasIndexOn(fields) {
        fields = fields.concat();
        fields.sort();

        return (
            _.findIndex(this.indexes, (index) => {
                return _.findIndex(index.fields, (f, idx) => fields.length <= idx || fields[idx] !== f) === -1;
            }) != -1
        );
    }

    /**
     * Add all indexes
     */
    addIndexes() {
        if (this.info.indexes) {
            _.each(this.info.indexes, (index) => {
                this.addIndex(index);
            });
        }
    }

    /**
     * Add an index
     * @param {object} index
     * @property {array} index.fields - Fields of the index
     * @property {bool} index.unique - Flag of uniqueness of the index
     * @returns {Entity}
     */
    addIndex(index) {
        if (!this.indexes) {
            this.indexes = [];
        }

        index = _.cloneDeep(index);

        assert: index.fields;

        if (!_.isArray(index.fields)) {
            index.fields = [index.fields];
        }

        let fields = index.fields;

        index.fields = _.map(fields, (field) => {
            let normalizedField = field; //_.camelCase(field);

            if (!this.hasField(normalizedField)) {
                throw new Error(`Index references non-exist field: ${field}, entity: ${this.name}.`);
            }

            return normalizedField;
        });

        index.fields.sort();

        if (this.hasIndexOn(index.fields)) {
            throw new Error(`Index on [${index.fields.join(', ')}] already exist in entity [${this.name}].`);
        }

        this.indexes.push(index);

        return this;
    }

    /**
     * Get a field object by field name or entity meta accesor (e.g. $key, $feature).
     * @param fieldId
     * @returns {Field}
     */
    getEntityAttribute(fieldId) {
        if (fieldId[0] === '$') {
            let token = fieldId.substr(1);

            switch (token) {
                case 'key':
                    if (Array.isArray(this.key)) {
                        throw new Error('Combination key not support for accesor "$key".');
                    }
                    return this.fields[this.key];

                case 'feature':
                    return this.features;

                default:
                    throw new Error(`Filed accessor "${token}" not supported!`);
            }
        } else {
            if (!this.hasField(fieldId)) {
                throw new Error(`Field "${fieldId}" not exists in entity "${this.name}".`);
            }

            return this.fields[fieldId];
        }
    }

    /**
     * Check whether the entity has a field with given name
     * @param {string} name
     * @returns {boolean}
     */
    hasField(name) {
        if (Array.isArray(name)) {
            return _.every(name, (fn) => this.hasField(fn));
        }

        return name in this.fields;
    }

    /**
     * Add association, dbms-specific
     * @param {*} name
     * @param {*} props
     * @example
     * e.g. mysql
     *  entity - Associated entity name
     *  join - Join type, e.g. INNER, LEFT, RIGHT, OUTER
     *  exclude - Exclude in output columns
     *  alias - Alias
     *  on - On conditions
     *  dataset - Sub query
     *  assocs - Child associations
     *  optional - Optional
     *  'default' - Default value
     *  list - Is a list
     */
    addAssociation(name, props) {
        if (!this.associations) {
            this.associations = {};
        }

        if (name in this.associations) {
            throw new Error(
                `Association "${name}" already exists in entity "${this.name}". Props: ` + JSON.stringify(props)
            );
        }

        this.associations[name] = props;
    }

    /**
     * Add a association field.
     * @param {string} name
     * @param {Entity} destEntity
     * @param {Field} destField
     */
    addAssocField(name, destEntity, destField, extraProps) {
        let localField = this.fields[name];

        if (localField) {
            throw new Error(`Field "${name}" already exists in entity "${this.name}".`);
        }

        let destFieldInfo = _.omit(destField.toJSON(), FunctionalQualifiers);
        Object.assign(destFieldInfo, extraProps);

        this.addField(name, destFieldInfo);
        //this.fields[name].displayName = fieldNaming(prefixNaming(destEntity.name, destField.name));
    }

    /**
     * Add a field into the entity
     * @param {string} name
     * @param {object} rawInfo
     * @returns {Entity}
     */
    addField(name, rawInfo) {
        if (this.hasField(name)) {
            throw new Error(`Field name [${name}] conflicts in entity [${this.name}].`);
        }

        assert: rawInfo.type;

        let field;

        if (rawInfo instanceof Field) {
            field = rawInfo.clone();
            field.name = name; // todo: displayName
        } else {
            let [fullRawInfo, baseInfo] = this.linker.trackBackType(this.xemlModule, rawInfo);
            if (baseInfo != null) {
                this.addUsedType(rawInfo.type, baseInfo.xemlModule.id);
            }

            field = new Field(name, fullRawInfo);
            field.link();
        }

        this.fields[name] = field;

        if (!this.key) {
            //make the first field as the default key
            this.key = name;
        }

        return this;
    }

    /**
     * Add a feature into the entity, e.g. auto increment id
     * @param {string} name
     * @param {*} feature
     * @param {bool} [allowMultiple=false] - Allow multiple occurrence
     * @returns {Entity}
     */
    addFeature(name, feature, allowMultiple) {
        if (!this.features) {
            this.features = {};
        }

        if (allowMultiple) {
            if (!this.features[name]) {
                this.features[name] = [];
            }

            this.features[name].push(feature);
        } else {
            this.features[name] = feature;
        }

        return this;
    }

    hasFeature(name) {
        return this.features && name in this.features;
    }

    /**
     * Set key name
     * @param {string|array.<string>} name - Field name to be used as the key
     * @returns {Entity}
     */
    setKey(name) {
        this.key = name;
        return this;
    }

    getReferencedEntityByPath(dotPath) {
        let parts = dotPath.split('.');
        let entity = this;

        for (let i = 0, l = parts.length; i < l; i++) {
            let part = parts[i];
            entity = entity.getReferencedEntity(part);
            if (entity == null) {
                throw new Error(`Entity association "${part}" not found in entity "${this.name}".`);
            }
        }

        return entity;
    }

    getReferencedEntity(entityName) {
        return this.linker.loadEntity(this.xemlModule, entityName);
    }

    /**
     * Returns the association info if there is connection to the given destination entity.
     */
    getReferenceTo(entityName, includes, excludes) {
        return (
            this.info.associations &&
            _.find(this.info.associations, (assoc) => {
                if (includes) {
                    if (
                        _.find(includes, (value, prop) =>
                            typeof value === 'function' ? !value(assoc[prop]) : !_.isEqual(assoc[prop], value)
                        )
                    )
                        return false;
                }

                if (excludes) {
                    if (excludes.association && assoc === excludes.association) return false;
                    if (excludes.type && assoc.type === excludes.type) return false;
                    if (excludes.associations && excludes.associations.indexOf(assoc) > -1) return false;
                    if (excludes.types && excludes.types.indexOf(assoc.type) > -1) return false;
                    if (excludes.props && _.find(excludes.props, (prop) => assoc[prop])) return false;
                }

                return assoc.destEntity === entityName;
            })
        );
    }

    /**
     * Get key field
     * @returns {*}
     */
    getKeyField() {
        return Array.isArray(this.key) ? this.key.map((kf) => this.fields[kf]) : this.fields[this.key];
    }

    /**
     * Clone the entity
     * @param {Map} [stack] - Reference stack to avoid recurrence copy
     * @returns {Entity}
     */
    clone() {
        super.clone();

        let entity = new Entity(this.linker, this.name, this.xemlModule, this.info);

        deepCloneField(this, entity, 'code');
        deepCloneField(this, entity, 'displayName');
        deepCloneField(this, entity, 'comment');
        deepCloneField(this, entity, 'features');
        deepCloneField(this, entity, 'fields');
        deepCloneField(this, entity, 'types');
        deepCloneField(this, entity, 'associations');
        deepCloneField(this, entity, 'key');
        deepCloneField(this, entity, 'indexes');
        deepCloneField(this, entity, 'inputs');
        deepCloneField(this, entity, 'views');
        deepCloneField(this, entity, 'interfaces');

        entity.linked = true;

        return entity;
    }

    /**
     * Translate the entity into a plain JSON object
     * @returns {object}
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            displayName: this.displayName,
            comment: this.comment,
            ...(this.baseClasses ? { baseClasses: this.baseClasses } : {}),
            features: this.features,
            types: this.types,
            fields: _.mapValues(this.fields, (field) => field.toJSON()),
            associations: this.associations,
            key: this.key,
            indexes: this.indexes,
        };
    }

    _getFeatureNameFromInfo(featureItem) {
        if (typeof featureItem === 'string') {
            return featureItem;
        }

        return featureItem.name;
    }

    _inherit(baseEntity) {
        let overrideInfo = {};

        if (baseEntity.baseClasses) {
            let baseClasses = baseEntity.baseClasses;

            if (this.baseClasses) {
                this.baseClasses = _.uniq(baseClasses.concat(this.baseClasses));
            } else {
                this.baseClasses = baseClasses.concat();
            }
        }

        if (!isEmpty(baseEntity.info.features)) {
            let baseFeatures = _.cloneDeep(baseEntity.info.features);

            if (this.info.features) {
                this.info.features.forEach(f => {
                    const featureName = this._getFeatureNameFromInfo(f);
                    const baseFeatureMeta = baseEntity.features[featureName];
                    if (baseFeatureMeta && !Array.isArray(baseFeatureMeta)) {
                        // singleton feature
                        baseFeatures = baseFeatures.filter((bf) => this._getFeatureNameFromInfo(bf) !== featureName);
                    }
                });

                overrideInfo.features = baseFeatures.concat(this.info.features);
            } else {
                overrideInfo.features = baseFeatures;
            }
        }

        if (!isEmpty(baseEntity.info.fields)) {
            let fields = _.cloneDeep(baseEntity.info.fields);
            overrideInfo.fields = { ...fields, ...this.info.fields };
        }

        if (baseEntity.info.key) {
            overrideInfo.key = baseEntity.info.key;
        }

        if (baseEntity.info.indexes) {
            let indexes = _.cloneDeep(baseEntity.info.indexes);
            let uniqueIndexes = indexes.filter((index) => index.unique);

            if (this.info.indexes) {
                this.info.indexes.forEach((index) => {
                    //if unique scope changed
                    if (index.unique) {
                        uniqueIndexes.forEach((inheritedIndex) => {
                            const fields1 = _.castArray(index.fields);
                            const fields2 = _.castArray(inheritedIndex.fields);

                            if (_.intersection(fields1, fields2).length === fields2.length) {
                                //fully included
                                const pos = indexes.indexOf(inheritedIndex);
                                if (pos !== -1) {
                                    indexes.splice(pos, 1);
                                }
                            }
                        });
                    }
                });

                indexes = indexes.concat(this.info.indexes);
            }

            overrideInfo.indexes = indexes;
        }

        if (baseEntity.info.associations) {
            let assocs = _.cloneDeep(baseEntity.info.associations);

            assocs = assocs.map((assoc) => {
                if (assoc.destEntity === baseEntity.name) {
                    return {
                        ...assoc,
                        destEntity: this.name,
                    };
                } else {
                    /*
                    const destEntity = this.linker.loadEntity(this.xemlModule, assoc.destEntity);
                    destEntity.info.associations[assoc.field]
                    */
                }

                return assoc;
            });

            if (this.info.associations) {
                assocs = assocs.concat(this.info.associations);
            }

            overrideInfo.associations = assocs;
        }

        if (baseEntity.inputs) {
            overrideInfo.inputs = { ...baseEntity.inputs, ...this.info.inputs };
        }

        if (baseEntity.views) {
            overrideInfo.views = { ...baseEntity.views, ...this.info.views };
        }

        if (!isEmpty(overrideInfo)) {
            this.info = { ...this.info, ...overrideInfo };
        }
    }
}

module.exports = Entity;
