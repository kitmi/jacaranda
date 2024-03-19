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
class JsvError extends Error {
    constructor(errorOrErrors, value, context){
        const errors = [];
        let inner = [];
        (Array.isArray(errorOrErrors) ? errorOrErrors : [
            errorOrErrors
        ]).forEach((err)=>{
            if (err.name === 'JsvError') {
                errors.push(...err.errors);
                inner = [
                    ...inner,
                    ...err.inner.length > 0 ? err.inner : [
                        err
                    ]
                ];
            } else {
                errors.push(err);
                if (err.inner && Array.isArray(err.inner)) {
                    inner = [
                        ...inner,
                        ...err.inner
                    ];
                }
            }
        });
        super(errors.length > 1 ? context.config.messages.MULTI_ERRORS(errors.length) : errors[0]);
        this.name = 'JsvError';
        this.value = value;
        this.path = context.path;
        this.errors = errors;
        this.inner = inner;
    }
}
const _default = JsvError;

//# sourceMappingURL=JsvError.js.map