import config from './config';
import validate from './validators';

/**
 * JSON Validation Syntax
 * @class
 */
class Jvs {
    static config = config;
    static match = (value, jvs, options, context) => {
        const reason = validate(
            value,
            jvs,
            {
                throwError: false,
                abortEarly: true,
                plainError: true,
                ...options,
            },
            { $$: value, $$ROOT: value, ...context }
        );
        if (reason === true) {
            return [true];
        }

        return [false, reason];
    };

    /**
     * @param {object} value
     */
    constructor(value) {
        this.value = value;
    }

    /**
     * Match the value with expected conditions in JSON expression
     * @param {object} expected - JSON match expression
     * @throws ValidationError
     * @returns {Jvs}
     */
    match(expected) {
        validate(this.value, expected, { throwError: true, abortEarly: true }, { $$: this.value, $$ROOT: this.value });
        return this;
    }
}

export default Jvs;
