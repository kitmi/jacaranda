import config from './config';
import loadMoreTransformers from './transformers';
import { createJSV, transform } from '@kitmi/jsonv';

export function createJSX(_config) {
    let _jsv;

    if (_config == null) {
        _jsv = createJSV();
        _config = _jsv.config;

        loadMoreTransformers(_config);
    } else {
        _jsv = createJSV(_config);
    }

    /**
     * JSON eXpression Syntax
     * @class
     */
    class JSX {
        static get JSV() {
            return _jsv;
        }

        static get config() {
            return _config;
        }

        static evaluate(value, jsx, context) {
            return transform(value, jsx, { config: this.config, ...context });
        }

        /**
         * @param {object} value
         */
        constructor(value) {
            this.value = value;
        }

        /**
         * Evaluate a JSON expression against the value and update the value
         * @param {object} - JSON operation expression
         * @returns {JSX}
         */
        evaluate(jsx) {
            this.value = transform(this.value, jsx, { config: this.constructor.config });
            return this;
        }
    }

    return JSX;
}

loadMoreTransformers(config);

const defaultJSX = createJSX(config);

export default defaultJSX;
