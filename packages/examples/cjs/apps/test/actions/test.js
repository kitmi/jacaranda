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
const _lib = require("../../../../../../lib");
async function middleware1(ctx, next) {
    ctx.state1 = 'Hello';
    return next();
}
const _default = {
    action1: (0, _lib.httpMethod)('get')(async (ctx)=>{
        ctx.body = 'action1';
    }),
    post: (0, _lib.httpMethod)('post:/action1')(async (ctx)=>{
        ctx.body = 'you post: ' + ctx.request.body.name;
    }),
    action2: (0, _lib.httpMethod)('get', middleware1)(async (ctx)=>{
        ctx.body = ctx.state1;
    }),
    action3: async (ctx)=>{
        ctx.body = ctx.state1;
    },
    action4: (0, _lib.httpMethod)('get')(async (ctx)=>{
        ctx.body = ctx.dummy;
    })
};

//# sourceMappingURL=test.js.map