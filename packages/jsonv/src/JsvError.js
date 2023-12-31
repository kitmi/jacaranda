import { messages } from './config';

class JsvError extends Error {
    constructor(errorOrErrors, value, field) {
        const errors = [];
        let inner = [];

        (Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors]).forEach((err) => {
            if (err.name === 'JsvError') {
                errors.push(...err.errors);
                inner = [...inner, ...(err.inner.length > 0 ? err.inner : [err])];
            } else {
                errors.push(err);
                if (err.inner && Array.isArray(err.inner)) {
                    inner = [...inner, ...err.inner];
                }
            }
        });

        super(errors.length > 1 ? messages.MULTI_ERRORS(errors.length) : errors[0]);

        this.name = 'JsvError';
        this.value = value;
        this.path = field;
        this.errors = errors;
        this.inner = inner;
    }
}

export default JsvError;
