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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
async function middleware1(ctx, next) {
    ctx.state1 = 'Hello';
    return next();
}
class Module2Controller {
    async action1(ctx) {
        ctx.body = 'action1';
    }
    async post(ctx) {
        ctx.body = 'you post: ' + ctx.request.body.name;
    }
    async action2(ctx) {
        ctx.body = ctx.state1;
    }
}
_ts_decorate([
    (0, _jacaranda.httpMethod)('get')
], Module2Controller.prototype, "action1", null);
_ts_decorate([
    (0, _jacaranda.httpMethod)('post:/action1')
], Module2Controller.prototype, "post", null);
_ts_decorate([
    (0, _jacaranda.httpMethod)('get', middleware1)
], Module2Controller.prototype, "action2", null);
const _default = Module2Controller;

//# sourceMappingURL=test2.js.map