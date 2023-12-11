/**
 * Test if an async function throws an error
 * @param {Function} fn - Function (async) that should throw an error
 * @param {*} error 
 */
const shouldThrow_ = async (fn, error) => {
    try {
        await fn();
        should.not.exist('here');
    } catch (e) {
        (() => {
            throw e;
        }).should.throws(error);
    }
};

export default shouldThrow_;
