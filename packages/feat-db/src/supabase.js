import { Feature } from '@kitmi/jacaranda';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['@supabase/supabase-js'],

    load_: async function (app, options, name) {
        const { url, privateKey } = app.featureConfig(
            options,
            {
                schema: {
                    url: { type: 'text' },
                    privateKey: { type: 'text' },
                },
            },
            name
        );

        const { createClient } = await app.tryRequire_('@supabase/supabase-js');

        const client = createClient(url, privateKey, { auth: { persistSession: false } });

        app.registerService(name, client);
    },
};
