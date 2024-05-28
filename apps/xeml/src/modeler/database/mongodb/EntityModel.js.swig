const { _ } = require('@genx/july');

const { 
    Types,
    Activators,
    Validators, 
    Processors, 
    Generators, 
    Errors: { BusinessError, DataValidationError, DsOperationError }, 
    Utils: { Lang: { isNothing } } 
} = require('@k-suite/oolong');
{{ imports|safe }} 

module.exports = (db, BaseEntityModel) => {
    const {{ className }}Spec = class extends BaseEntityModel {    
        {{ classBody|safe }}
    };

    {{ className }}Spec.db = db;
    {{ className }}Spec.meta = {{ entityMeta|safe }};

    return Object.assign({{ className }}Spec, {{ functors|safe }}{% for m in mixins %}{% if loop.first %}, {% endif %}{{m}}{% if not loop.last %}, {% endif %}{% endfor %});
};