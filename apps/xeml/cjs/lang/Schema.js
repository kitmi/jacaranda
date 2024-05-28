"use strict";
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
const { _ } = require('@genx/july');
const { generateDisplayName, deepCloneField, Clonable, schemaNaming } = require('./GemlUtils');
/**
 * Geml schema class.
 * @class Schema
 */ class Schema extends Clonable {
    /**
     * Start linking this schema
     * @returns {Schema}
     */ link() {
        pre: !this.linked;
        this.linker.log('verbose', 'Linking schema [' + this.name + '] ...');
        if (this.info.comment) {
            /**
             * @member {string}
             */ this.comment = this.info.comment;
        }
        /**
         * @member {string}
         */ this.displayName = generateDisplayName(this.name);
        //1st round, get direct output entities
        this.info.entities || (this.info.entities = []);
        this.info.entities.forEach((entityEntry)=>{
            let entity1 = this.linker.loadEntity(this.gemlModule, entityEntry.entity);
            if (!entity1.linked) {
                throw new Error(`Entity [${entity1.name}] not linked after loading.`);
            }
            this.addEntity(entity1);
        });
        if (!_.isEmpty(this.info.views)) {
            this.info.views.forEach((viewName)=>{
                let view = this.linker.loadView(this.gemlModule, viewName);
                if (!view.linked) {
                    throw new Error(`View [${entity.name}] not linked after loading.`);
                }
                this.addView(view);
            });
        }
        this.linked = true;
        return this;
    }
    /**
     * Add an type into the schema
     * @param {*} type 
     * @param {*} typeLocation 
     * @returns 
     */ addType(type, typeLocation) {
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
     */ hasEntity(entityName) {
        return entityName in this.entities;
    }
    /**
     * Add an entity into the schema
     * @param {Entity} entity
     * @returns {Schema}
     */ addEntity(entity1) {
        if (this.hasEntity(entity1.name)) {
            throw new Error(`Entity name [${entity1.name}] conflicts in schema [${this.name}].`);
        }
        this.entities[entity1.name] = entity1;
        _.each(entity1.types, (info, type)=>this.addType(type, info));
        return this;
    }
    /**
     * Check whether a view with given name is in the schema
     * @param {string} viewName
     * @returns {boolean}
     */ hasView(viewName) {
        return viewName in this.views;
    }
    /**
     * Add a view into the schema
     * @param {View} view 
     * @returns {Schema}
     */ addView(view) {
        pre: !this.hasView(view.name), `View name [${view.name}] conflicts in schema [${this.name}].`;
        this.views[view.name] = view;
        return this;
    }
    /**
     * Get a document hierarchy
     * @param {object} fromModule
     * @param {string} datasetName
     * @returns {object}
     */ getDocumentHierachy(fromModule, datasetName) {
        if (datasetName in this.datasets) {
            return this.datasets[datasetName];
        }
        let dataset = this.linker.loadDataset(fromModule, datasetName);
        return this.datasets[datasetName] = dataset.buildHierarchy(this);
    }
    /**
     * Get the referenced entity, add it into schema if not in schema
     * @param {object} refererModule
     * @param {string} entityName
     * @returns {Entity}
     */ getReferencedEntity(refererModule, entityName) {
        let entity1 = this.linker.loadEntity(refererModule, entityName);
        if (!this.hasEntity(entity1.name)) {
            throw new Error(`Entity "${entity1.name}" not exists in schema "${this.name}".`);
        }
        return entity1;
    }
    /**
     * 
     * @param {*} refererModule 
     * @param {*} entityName 
     */ ensureGetEntity(refererModule, entityName, newlyAdded) {
        if (this.hasEntity(entityName)) return this.entities[entityName];
        let entity1 = this.linker.loadEntity(refererModule, entityName, false);
        if (entity1) {
            this.addEntity(entity1);
            if (newlyAdded) {
                newlyAdded.push(entity1.name);
                this.linker.log('debug', `New entity "${entity1.name}" added by association.`);
            }
        }
        return entity1;
    }
    /**
     * Clone the schema
     * @returns {Schema}
     */ clone() {
        super.clone();
        let schema = new Schema(this.linker, this.name, this.info);
        deepCloneField(this, schema, 'displayName');
        deepCloneField(this, schema, 'comment');
        deepCloneField(this, schema, 'entities');
        deepCloneField(this, schema, 'types');
        deepCloneField(this, schema, 'datasets');
        deepCloneField(this, schema, 'views');
        schema.linked = true;
        return schema;
    }
    /**
     * Translate the schema into a plain JSON object
     * @returns {object}
     */ toJSON() {
        return {
            name: this.name,
            displayName: this.displayName,
            comment: this.comment,
            entities: _.mapValues(this.entities, (entity1)=>entity1.toJSON()),
            types: this.types,
            datasets: _.mapValues(this.datasets, (dataset)=>dataset.toJSON()),
            views: _.mapValues(this.views, (view)=>view.toJSON())
        };
    }
    /**     
     * @param {Linker} linker
     * @param {string} name     
     * @param {object} info
     */ constructor(linker, name, info){
        super();
        /**
     * Types in this schema, map of <typeName, typeInfo>
     * @member {object.<String, Object>}
     */ _define_property(this, "types", {});
        /**
     * Entities in this schema, map of <entityName, entityObject>
     * @member {object.<string, Entity>}
     */ _define_property(this, "entities", {});
        /**
     * Datasets, dataset = entity + relations + projection
     * @member {object}
     */ _define_property(this, "datasets", {});
        /**
     * Views, view = dataset + filters 
     * @member {object}
     */ _define_property(this, "views", {});
        /**
         * Linker to process this schema
         * @member {Linker}
         */ this.linker = linker;
        /**
         * Name of this entity
         * @member {string}
         */ this.name = schemaNaming(name);
        /**
         * Owner geml module
         * @member {object}
         */ this.gemlModule = this.linker.entryModule;
        /**
         * Raw metadata
         * @member {object}
         */ this.info = info;
    }
}
module.exports = Schema;

//# sourceMappingURL=Schema.js.map