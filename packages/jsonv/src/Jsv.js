import defaultConfig, { Config } from './config';
import validate from './validate';
import loadValidators from './validatorsLoader';
import loadTransformers from './transformersLoader';

export function createJSV(_config) {
    if (_config == null) {
        _config = new Config();

        loadValidators(_config);
        loadTransformers(_config);
    }

    /**
     * JSON Validation Syntax
     * @class
     */
    class JSV {
        static get config() {
            return _config;
        }

        static match(value, jsv, options, context) {
            const reason = validate(
                value,
                jsv,
                {
                    throwError: false,
                    abortEarly: true,
                    plainError: true,
                    ...options,
                },
                { config: this.config, ...context }
            );
            if (reason === true) {
                return [true];
            }

            return [false, reason];
        }

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
         * @returns {JSV}
         */
        match(expected) {
            validate(this.value, expected, { throwError: true, abortEarly: true }, { config: this.constructor.config });
            return this;
        }
    }

    return JSV;
}

loadValidators(defaultConfig);
loadTransformers(defaultConfig);

const defaultJSV = createJSV(defaultConfig);

export default defaultJSV;
