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
const _default = {
    index: async function(ctx) {
        ctx.body = 'Hello Jacaranda!';
    },
    shutdown: async function(ctx) {
        ctx.body = 'Shutting down...';
        setTimeout(()=>{
            process.kill(process.pid, "SIGINT");
        }, 100);
    }
};

//# sourceMappingURL=home.js.map