"use strict";
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