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
const _default = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */ stage: _jacaranda.Feature.SERVICE,
    load_: async function(app, config, name) {
        const { param } = config;
        const service = {
            getParam: ()=>param
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=appFeature.js.map