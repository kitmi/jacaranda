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
    list: (ctx)=>{
        const feature = ctx.module.getService('appFeature');
        const param = feature.getParam();
        ctx.body = {
            param
        };
    }
};

//# sourceMappingURL=feature.js.map