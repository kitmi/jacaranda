"use strict";
const { _ } = require('@genx/july');
const { deepCloneField, Clonable, isDotSeparateName } = require('./GemlUtils');
/**
 * Geml dataset class.
 * @class Dataset
 */ class Dataset extends Clonable {
    /**
     * Start linking this dataset
     * @returns {Dataset}
     */ link() {
        pre: !this.linked;
        if (this.info.entity) {
            let entity = this.linker.getReferencedEntity(this.gemlModule, this.info.entity);
            this.mainEntity = entity.name;
        } else {
            let dataset = this.linker.loadDataset(this.gemlModule, this.info.dataset);
            assert: dataset.linked;
            this.mainEntity = dataset.mainEntity;
            this.joinWith = _.cloneDeep(dataset.joinWith);
        }
        if (!_.isEmpty(this.info.joinWith)) {
            if (!this.joinWith) {
                this.joinWith = _.cloneDeep(this.info.joinWith);
            } else {
                this.joinWith = this.joinWith.concat(this.info.joinWith);
            }
        }
        this.linked = true;
        return this;
    }
    buildHierarchy(inSchema) {
        return this._flattenDataset(inSchema, this);
    }
    _flattenDataset(inSchema, dataset) {
        let hierarchy = {};
        let leftEntity = inSchema.entities[dataset.mainEntity];
        if (dataset.joinWith) {
            dataset.joinWith.forEach((joining)=>{
                let leftField, rightEntity, rightField;
                if (isDotSeparateName(joining.on.left)) {
                    let lastPos = joining.on.left.lastIndexOf('.');
                    let fieldRef = joining.on.left.substr(lastPos + 1);
                    let entityRef = joining.on.left.substr(0, lastPos);
                    if (entityRef === leftEntity.name) {
                        leftField = leftEntity.getEntityAttribute(fieldRef);
                    } else {
                        throw new Error(`Unsupported syntax of left side joining field "${joining.on.left}".`);
                    }
                } else {
                    //field of leftEntity
                    leftField = leftEntity.getEntityAttribute(joining.on.left);
                }
                if (joining.dataset) {
                    let rightHierarchy = inSchema.getDocumentHierachy(this.gemlModule, joining.dataset);
                    if (isDotSeparateName(joining.on.right)) {
                        let parts = joining.on.right.split('.');
                        if (parts.length > 2) {
                            throw new Error('Joining a document should only referencing to a field of its main entity.');
                        }
                        let [entityRef, fieldRef] = parts;
                        if (entityRef !== rightHierarchy.entity) {
                            throw new Error(`Referenced field "${joining.on.right}" not found while linking to document "${joining.dataset}".`);
                        }
                        assert: !hierarchy[leftField.name], 'Duplicate joinings on the same field of the left side entity.';
                        rightEntity = inSchema.entities[entityRef];
                        rightField = rightEntity.getEntityAttribute(fieldRef);
                        hierarchy[leftField.name] = Object.assign({}, rightHierarchy, {
                            linkWithField: rightField.name
                        });
                        return;
                    }
                    //joining.on.right is field name of the main entity
                    rightEntity = inSchema.entities[joining.dataset.mainEntity];
                } else {
                    rightEntity = inSchema.entities[joining.entity];
                    if (isDotSeparateName(joining.on.right)) {
                        throw new Error(`Referenced field "${joining.on.right}" not found while linking to entity "${joining.entity}".`);
                    }
                }
                //field of rightEntity
                rightField = rightEntity.getEntityAttribute(joining.on.right);
                assert: !hierarchy[leftField.name], 'Duplicate joinings on the same field of the left side entity.';
                hierarchy[leftField.name] = {
                    oolType: 'DocumentHierarchyNode',
                    entity: rightEntity.name,
                    linkWithField: rightField.name
                };
            });
        }
        return {
            oolType: 'DocumentHierarchyNode',
            entity: leftEntity.name,
            subDocuments: hierarchy
        };
    }
    /**
     * Clone the document
     * @returns {Dataset}
     */ clone() {
        super.clone();
        let dataset = new Dataset(this.linker, this.name, this.gemlModule, this.info);
        dataset.mainEntity = this.mainEntity;
        deepCloneField(this, dataset, 'joinWith');
        dataset.linked = true;
        return dataset;
    }
    /**
     * Translate the document into a plain JSON object
     * @returns {object}
     */ toJSON() {
        return {
            name: this.name,
            mainEntity: this.mainEntity.toJSON(),
            joinWith: this.joinWith
        };
    }
    /**     
     * @param {Linker} linker
     * @param {string} name - Dataset name
     * @param {object} gemlModule - Source ool module
     * @param {object} info - Dataset info
     */ constructor(linker, name, gemlModule, info){
        super();
        /**
         * Linker to process this document
         * @member {Linker}
         */ this.linker = linker;
        /**
         * Name of this document
         * @member {string}
         */ this.name = _.camelCase(name);
        /**
         * Owner oolong module
         * @member {object}
         */ this.gemlModule = gemlModule;
        /**
         * Raw metadata
         * @member {Object}
         */ this.info = info;
    }
}
module.exports = Dataset;

//# sourceMappingURL=Dataset.js.map