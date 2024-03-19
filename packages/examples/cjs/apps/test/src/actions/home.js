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
    index: async (ctx)=>{
        await ctx.render('index', {
            title: 'Test.index',
            name: 'Swig'
        });
    }
};

//# sourceMappingURL=home.js.map