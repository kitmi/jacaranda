const { _ } = require('@kitmi/utils');
const { generateDisplayName, deepCloneField, Clonable, schemaNaming } = require('./XemlUtils');
const { MetadataEntity } = require('./XemlTypes');

/**
 * Geml schema class.
 * @class Schema
 */
class Schema extends Clonable {
    /**
     * Types in this schema, map of <typeName, typeInfo>
     * @member {object.<String, Object>}
     */
    types = {};

    /**
     * Entities in this schema, map of <entityName, entityObject>
     * @member {object.<string, Entity>}
     */
    entities = {};

    /**
     * @param {Linker} linker
     * @param {string} name
     * @param {object} info
     */
    constructor(linker, name, info) {
        super();

        /**
         * Linker to process this schema
         * @member {Linker}
         */
        this.linker = linker;

        /**
         * Name of this entity
         * @member {string}
         */
        this.name = schemaNaming(name);

        /**
         * Owner geml module
         * @member {object}
         */
        this.xemlModule = this.linker.entryModule;

        /**
         * Raw metadata
         * @member {object}
         */
        this.info = info;
    }

    /**
     * Start linking this schema
     * @returns {Schema}
     */
    link() {
        if (this.linked) {
            throw new Error(`Schema [${this.name}] already linked.`);
        }

        this.linker.log('verbose', 'Linking schema [' + this.name + '] ...');

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

        //1st round, get direct output entities
        this.info.entities || (this.info.entities = []);

        this.info.entities.forEach((entityEntry) => {
            let entity = this.linker.loadEntity(this.xemlModule, entityEntry.entity);
            if (!entity.linked) {
                throw new Error(`Entity [${entity.name}] not linked after loading.`);
            }

            this.addEntity(entity);
        });

        if (!this.hasEntity(MetadataEntity)) {
            let entity = this.linker.loadEntity(this.xemlModule, MetadataEntity);
            if (!entity.linked) {
                throw new Error(`Entity [${entity.name}] not linked after loading.`);
            }

            this.addEntity(entity);
        }

        this.linked = true;

        return this;
    }

    /**
     * Add an type into the schema
     * @param {*} type
     * @param {*} typeLocation
     * @returns {Schema}
     */
    addType(type, typeLocation) {
        const existing = this.types[type];
        if (existing == null) {
            this.types[type] = typeLocation;
        } else {
            if (existing !== typeLocation) {
                //should never happen
                throw new Error('Different used types appear in the same entity!');
            }
        }

        return this;
    }

    /**
     * Check whether a entity with given name is in the schema
     * @param {string} entityName
     * @returns {boolean}
     */
    hasEntity(entityName) {
        return entityName in this.entities;
    }

    /**
     * Add an entity into the schema
     * @param {Entity} entity
     * @returns {Schema}
     */
    addEntity(entity) {
        if (this.hasEntity(entity.name)) {
            throw new Error(`Entity name [${entity.name}] conflicts in schema [${this.name}].`);
        }

        this.entities[entity.name] = entity;

        _.each(entity.types, (info, type) => this.addType(type, info));

        return this;
    }

    /**
     * Get the referenced entity, add it into schema if not in schema
     * @param {object} refererModule
     * @param {string} entityName
     * @returns {Entity}
     */
    getReferencedEntity(refererModule, entityName) {
        let entity = this.linker.loadEntity(refererModule, entityName);

        if (!this.hasEntity(entity.name)) {
            throw new Error(`Entity "${entity.name}" not exists in schema "${this.name}".`);
        }

        return entity;
    }

    /**
     *
     * @param {*} refererModule
     * @param {*} entityName
     */
    ensureGetEntity(refererModule, entityName, newlyAdded) {
        if (this.hasEntity(entityName)) return this.entities[entityName];

        let entity = this.linker.loadEntity(refererModule, entityName, false);

        if (entity) {
            this.addEntity(entity);

            if (!entity.info.abstract && newlyAdded) {
                newlyAdded.push(entity.name);
                this.linker.log('verbose', `New entity "${entity.name}" added by association.`);
            }
        }

        return entity;
    }

    /**
     * Clone the schema
     * @returns {Schema}
     */
    clone() {
        super.clone();

        let schema = new Schema(this.linker, this.name, this.info);

        deepCloneField(this, schema, 'displayName');
        deepCloneField(this, schema, 'comment');
        deepCloneField(this, schema, 'entities');
        deepCloneField(this, schema, 'types');

        schema.linked = true;

        return schema;
    }

    /**
     * Translate the schema into a plain JSON object
     * @returns {object}
     */
    toJSON() {
        const result = {
            name: this.name,
            displayName: this.displayName,
            comment: this.comment,
            entities: _.mapValues(this.entities, (entity) => entity.toJSON()),
            types: this.types,
            views: _.mapValues(this.views, (view) => view.toJSON()),
        };

        // extra metadata for storing in database
        if (this.relations) {
            result.relations = this.relations;
        }

        return result;
    }
}

module.exports = Schema;
