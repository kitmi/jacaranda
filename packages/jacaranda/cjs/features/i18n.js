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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.CONF,
    load_: async function(app, options, name) {
        options = app.featureConfig(options, {
            schema: {
                locale: {
                    type: 'text',
                    default: 'en'
                },
                timezone: {
                    type: 'text',
                    optional: true
                }
            }
        }, name);
        app.i18n = options;
    }
};

//# sourceMappingURL=i18n.js.map