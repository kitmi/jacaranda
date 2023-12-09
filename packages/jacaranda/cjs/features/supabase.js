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
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        '@supabase/supabase-js'
    ],
    load_: async function(app, options, name) {
        const { url, privateKey } = app.featureConfig(options, {
            schema: {
                url: {
                    type: 'text'
                },
                privateKey: {
                    type: 'text'
                }
            }
        }, name);
        const { createClient } = await app.tryRequire_('@supabase/supabase-js');
        const client = createClient(url, privateKey, {
            auth: {
                persistSession: false
            }
        });
        app.registerService(name, client);
    }
};

//# sourceMappingURL=supabase.js.map