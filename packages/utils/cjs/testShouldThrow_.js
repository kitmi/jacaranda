/**
 * Test if an async function throws an error
 * @param {Function} fn - Function (async) that should throw an error
 * @param {*} error 
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const shouldThrow_ = async (fn, error)=>{
    try {
        await fn();
        should.not.exist('here');
    } catch (e) {
        (()=>{
            throw e;
        }).should.throws(error);
    }
};
const _default = shouldThrow_;

//# sourceMappingURL=testShouldThrow_.js.map