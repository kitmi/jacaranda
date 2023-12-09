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
const defaultValueByType = (options, meta, context)=>context.system.types[meta.type].defaultValue;
const _default = {
    default: defaultValueByType
};

//# sourceMappingURL=common.js.map