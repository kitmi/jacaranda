import config from './config';
import transform from './transformers';

/**
 * JSON eXpression Syntax
 * @class
 */
class JSX {
    static config = config;

    static evaluate = (value, jsx, context) => {
        return transform(value, jsx, { config: this.config, ...context });
    };

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

export default JSX;
