import Feature from '../Feature';

export default {
    stage: Feature.CONF,

    load_: async function (app, options, name) {
        options = app.featureConfig(
            options,
            {
                schema: 
                    {
                        locale: { type: 'text', default: 'en' },
                        timezone: { type: 'text', optional: true },
                    }
            },
            name
        );

        app.i18n = options;
    },
};
