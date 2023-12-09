import Feature from '../Feature';

export default {
    stage: Feature.INIT,

    groupable: true,

    packages: ['jsonwebtoken'],

    load_: async function (app, options, name) {
        let { key, privateKey, publicKey } = app.featureConfig(
            options,
            {
                schema: [
                    {
                        key: { type: 'text' },
                    },
                    {
                        privateKey: { type: 'text', mod: ['|trimLines'] },
                        publicKey: { type: 'text', mod: ['|trimLines'] },
                    },
                ],
            },
            name
        );

        let asymmetric = false;

        if (key) {
            privateKey = key;
            publicKey = key;
        } else {
            asymmetric = true;
        }

        const jwt = app.tryRequire('jsonwebtoken');

        const service = {
            get publicKey() {
                return publicKey;
            },
            sign: (payload, options) => {
                return jwt.sign(payload, privateKey, asymmetric ? { algorithm: 'RS256', ...options } : options);
            },
            verify: (token, options) => {
                return jwt.verify(token, publicKey, asymmetric ? { algorithm: 'RS256', ...options } : options);
            },
        };

        app.registerService(name, service);
    },
};
