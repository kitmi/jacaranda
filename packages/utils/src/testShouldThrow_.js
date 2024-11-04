import _each from 'lodash/each';

/**
 * Test if an async function throws an error
 * @param {Function} fn - Function (async) that should throw an error
 * @param {*} error 
 */
const shouldThrow_ = async (fn, error, details) => {
    try {
        await fn();
        // eslint-disable-next-line no-undef
        should.not.exist('here');
    } catch (e) {
        if (details) {
            _each(details, (value, key) => {
                should.exist(e[key]);
                e[key].should.eql(value);
            });
        }

        (() => {
            throw e;
        }).should.throws(error);
    }
};

export default shouldThrow_;
