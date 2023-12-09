"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const makeValidator = (validateFunc, message)=>(value, options, meta, context)=>{
        const validated = validateFunc(value, options);
        if (!validated) {
            return [
                false,
                context.i18n?.t ? context.i18n.t(message, {
                    value,
                    options
                }) : message
            ];
        }
        return [
            true
        ];
    };
const _default = makeValidator;

//# sourceMappingURL=makeValidator.js.map