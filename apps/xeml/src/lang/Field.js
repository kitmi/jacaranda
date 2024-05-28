"use strict";

const { _ } = require('@genx/july');
const { generateDisplayName, deepCloneField, Clonable, fieldNaming } = require('./XemlUtils');
const { Types } = require('@genx/data');
const RESERVED_KEYS = new Set(['name', 'type', 'modifiers', 'subClass', 'values']);

/**
 * Geml entity field class.
 * @class
 */
class Field extends Clonable {
    /**
     * @param {string} name
     * @param {object} info
     */
    constructor(name, info) {
        super();

        this.name = fieldNaming(name);

        /**
         * Original type information.
         * @member {object}
         */
        this.info = info;        
    }

    /**
     * Linking the 
     */
    link() {
        assert: this.info.type in Types;
        let typeObject = Types[this.info.type];

        _.forOwn(this.info, (value, key) => {
            if (RESERVED_KEYS.has(key)) {
                this[key] = value;
                return;
            }       

            if (!typeObject.qualifiers.includes(key)) {
                throw new Error(`Unsupported field qualifier "${key}" for type "${this.info.type}" of field "${this.name}."`);
            }

            this[key] = Array.isArray(value) ? value[0] : value;
        });

        if (this.info.modifiers && _.find(this.info.modifiers, mod => mod.$xt === 'Activator')) {
            this.hasActivator = true;
        }

        /**
         * The default name of the field
         * @member {string}
         */
        this.displayName = generateDisplayName(this.name);        

        deepCloneField(this.info, this, 'modifiers');

        this.linked = true;
    }

    hasSameType(targetField) {
        return _.isEqual(this.toJSON(), targetField);
    }

    /**
     * Clone the field     
     * @returns {Field}
     */
    clone() {
        super.clone();

        let field = new Field(this.name, this.info);
        Object.assign(field, this.toJSON());
        field.linked = true;
        
        return field;
    }

    /**
     * Translate the field into a plain JSON object
     * @returns {object}
     */
    toJSON() {
        return _.omit(_.toPlainObject(this), [ 'name', 'linked', 'info' ]);
    }
}

module.exports = Field;