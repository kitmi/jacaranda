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
const _jacaranda = require("@kitmi/jacaranda");
async function middleware1(ctx, next) {
    ctx.state1 = 'Hello';
    return next();
}
const _default = {
    action1: (0, _jacaranda.httpMethod)('get')(async (ctx)=>{
        ctx.body = 'action1';
    }),
    post: (0, _jacaranda.httpMethod)('post:/action1')(async (ctx)=>{
        ctx.body = 'you post: ' + ctx.request.body.name;
    }),
    action2: (0, _jacaranda.httpMethod)('get', middleware1)(async (ctx)=>{
        ctx.body = ctx.state1;
    }),
    action3: async (ctx)=>{
        ctx.body = ctx.state1;
    },
    action4: (0, _jacaranda.httpMethod)('get')(async (ctx)=>{
        ctx.body = ctx.dummy;
    })
};

//# sourceMappingURL=test.js.map