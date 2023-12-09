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
    query: (ctx)=>{
        const feature = ctx.appModule.getService('appFeature');
        const param = feature.getParam();
        ctx.body = {
            param
        };
    }
};

//# sourceMappingURL=feature.js.map