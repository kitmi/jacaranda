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
