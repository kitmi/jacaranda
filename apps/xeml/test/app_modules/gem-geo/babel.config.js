//babel config for node.js app
const targetLTSVersion = '14';

const isBabelRegister = (caller) =>
    !!(caller && caller.name === '@babel/register');

module.exports = function (api) {
    const isProduction = api.env(['production']);
    const isRegister = api.caller(isBabelRegister);

    const targets = {
        targets: {
            node: targetLTSVersion,
        },
    };

    const plugins = [];

    if (isProduction) {
        plugins.push('source-map-support');
    }

    plugins.push(
        ...[
            [
                '@babel/plugin-proposal-decorators',
                {
                    legacy: true,
                },
            ],
            [
                '@babel/plugin-proposal-class-properties',
                {
                    loose: true,
                },
            ],
        ]
    );

    const opts = {
        ...(isRegister ? {} : targets),
        sourceMaps: isProduction ? true : 'inline',
        presets: [
            [
                '@babel/env',
                {
                    loose: true,
                    ...targets,
                },
            ],
        ],
        comments: false,
        ignore: ['node_modules'],
        plugins,
    };

    return opts;
};
