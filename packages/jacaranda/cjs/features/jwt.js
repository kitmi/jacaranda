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
    stage: _Feature.default.INIT,
    groupable: true,
    packages: [
        'jsonwebtoken'
    ],
    load_: async function(app, options, name) {
        let { key, privateKey, publicKey } = app.featureConfig(options, {
            schema: [
                {
                    key: {
                        type: 'text'
                    }
                },
                {
                    privateKey: {
                        type: 'text',
                        mod: [
                            '|trimLines'
                        ]
                    },
                    publicKey: {
                        type: 'text',
                        mod: [
                            '|trimLines'
                        ]
                    }
                }
            ]
        }, name);
        let asymmetric = false;
        if (key) {
            privateKey = key;
            publicKey = key;
        } else {
            asymmetric = true;
        }
        const jwt = app.tryRequire('jsonwebtoken');
        const service = {
            get publicKey () {
                return publicKey;
            },
            sign: (payload, options)=>{
                return jwt.sign(payload, privateKey, asymmetric ? {
                    algorithm: 'RS256',
                    ...options
                } : options);
            },
            verify: (token, options)=>{
                return jwt.verify(token, publicKey, asymmetric ? {
                    algorithm: 'RS256',
                    ...options
                } : options);
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=jwt.js.map