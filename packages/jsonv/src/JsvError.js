class JsvError extends Error {
    constructor(errorOrErrors, context) {
        const errors = [];
        let inner = [];

        (Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors]).forEach((err) => {
            if (err.name === 'JsvError') {
                if (err.errors) {
                    // multiple errors
                    errors.push(...err.errors);
                    inner.push(...err.inner);
                } else {
                    errors.push(err.message);
                    inner.push(err);
                }
            } else if (err instanceof Error) {
                errors.push(err.message);
                inner.push(err);
            } else {
                errors.push(err);
            }
        });

        super(errors.length > 1 ? context.config.messages.MULTI_ERRORS(errors.length) : errors[0]);

        this.name = 'JsvError';
        this.path = context.path;

        if (errors.length > 1) {
            this.errors = errors;
            this.inner = inner;            
        } else if (inner.length > 0 && inner[0].path) {
            this.path = inner[0].path;
        }
    }
}

export default JsvError;
