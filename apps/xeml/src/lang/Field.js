const { _ } = require('@kitmi/utils');
const { generateDisplayName, deepCloneField, Clonable, fieldNaming } = require('./XemlUtils');
const Types = require('./Types');

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
        if (!(this.info.type in Types)) {
            throw new Error(`Unsupported field type "${this.info.type}" of field "${this.name}."`);
        }
        let typeObject = Types[this.info.type];

        _.forOwn(this.info, (value, key) => {
            if (Types.RESERVED_QUALIFIERS.has(key)) {
                this[key] = value;
                return;
            }

            if (!typeObject.qualifiers.includes(key)) {
                throw new Error(
                    `Unsupported field qualifier "${key}" for type "${this.info.type}" of field "${this.name}."`
                );
            }

            this[key] = key === 'enum' ? value : Array.isArray(value) && value.length === 1 ? value[0] : value;
        });

        if (this.info.modifiers && _.find(this.info.modifiers, (mod) => mod.$xt === 'Activator')) {
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
        return _.omit(_.toPlainObject(this), ['linked', 'info']);
    }
}

module.exports = Field;
