const XemlTypes = {
    Lang: Object.freeze({
        CONST_REF: 'ConstReference',
        OBJECT_REF: 'ObjectReference',
        STRING_TMPL: 'StringTemplate',
        VALIDATOR: 'Validator',
        PROCESSOR: 'Processor',
        ACTIVATOR: 'Activator',
        PIPELINE_VAL: 'PipedValue',
        FUNCTION_CALL: 'FunctionCall',
        SYMBOL_TOKEN: 'Symbol',
    }),
    Element: Object.freeze({
        CONST: 'constant',
        TYPE: 'type',
        ACTIVATOR: 'Activator',
        PROCESSOR: 'Processor',
        VALIDATOR: 'Validator',
        ENTITY: 'entity',
        ENTITY_TEMPLATE: 'entityTemplate',
        SCHEMA: 'schema',
        DATASET: 'dataset',
        VIEW: 'view',
        ENTITY_OVERRIDE: 'entityOverride'
    }),
    Relationship: Object.freeze({
        HAS_ONE: 'hasOne',
        HAS_MANY: 'hasMany',        
        BELONGS_TO: 'belongsTo',
        REFERS_TO: 'refersTo'
    }),
    Modifier: Object.freeze({
        VALIDATOR: 'Validator',
        PROCESSOR: 'Processor',
        ACTIVATOR: 'Activator'
    })
};

XemlTypes.ModifiersList = Object.values(XemlTypes.Modifier);

module.exports = Object.freeze(XemlTypes);