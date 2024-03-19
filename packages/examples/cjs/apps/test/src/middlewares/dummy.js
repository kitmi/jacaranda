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
const dummy = (opts, app)=>{
    return async (ctx, next)=>{
        ctx.dummy = 'dummy';
        return next();
    };
};
const _default = dummy;

//# sourceMappingURL=dummy.js.map