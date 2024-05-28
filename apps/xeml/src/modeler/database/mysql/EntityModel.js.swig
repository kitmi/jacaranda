const { _ } = require('@genx/july');
const { 
    Types,
    Activators,
    Validators, 
    Processors, 
    Generators, 
    Errors: { ValidationError, DatabaseError }, 
    Utils: { Lang: { isNothing } } 
} = require('@genx/data');
{{ imports|safe }} 

module.exports = (Base) => {    
    const {{ className }}Spec = class extends Base {    
        {{ classBody|safe }}
    };
    
    {{ className }}Spec.meta = {{ entityMeta|safe }};

    return Object.assign({{ className }}Spec, {{ functors|safe }});
};