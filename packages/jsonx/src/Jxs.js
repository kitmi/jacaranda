import config from './config';
import transform from './transformers';

/**
 * JSON eXpression Syntax
 * @class
 */
class Jxs {
    static config = config;
    static evaluate = transform;

    /**
     * @param {object} value
     */
    constructor(value) {
        this.value = value;
    }

    /**
     * Evaluate a JSON expression against the value and update the value
     * @param {object} - JSON operation expression
     * @returns {Jxs}
     */
    update(jxs) {
        this.value = transform(this.value, jxs);
        return this;
    }
}

export default Jxs;
