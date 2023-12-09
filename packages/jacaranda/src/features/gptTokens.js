import Feature from '../Feature';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['gpt-tokens'],

    load_: async function (app, options, name) {
        const { GPTTokens } = await app.tryRequire_('gpt-tokens');

        const { model } = app.featureConfig(
            options,
            {
                schema: {
                    model: { type: 'text', default: 'gpt-3.5-turbo' },
                },
            },
            name
        );

        const service = {
            getUsedTokens: (messages) => {
                const usageInfo = new GPTTokens({
                    model,
                    messages,
                });

                return usageInfo.usedTokens;
            },
        };

        app.registerService(name, service);
    },
};
