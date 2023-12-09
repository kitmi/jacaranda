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
const superagentAdapter = (superagent)=>{
    const agent = superagent.agent();
    return {
        createRequest (method, url) {
            return agent[method](url);
        }
    };
};
const _default = superagentAdapter;

//# sourceMappingURL=superagent.js.map