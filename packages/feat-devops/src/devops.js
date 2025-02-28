import { Feature, DeferredService } from '@kitmi/jacaranda';
import GitClientFactory from './drivers/GitClientFactory';
import { createGitService } from './baseGitService';

const DEFAULT_PROVIDER = 'gitea';

export default {
    stage: Feature.SERVICE,
    groupable: true,
    load_: async function (app, opts, name) {
        const service = new DeferredService(() => {
            const { provider = DEFAULT_PROVIDER, url, token, ...otherOptions } = app.featureConfig(
                opts,
                {
                    schema: {
                        provider: { type: 'text', default: DEFAULT_PROVIDER },
                        url: { type: 'text' },
                        token: { type: 'text' },
                    },
                },
                name
            );

            const client = GitClientFactory.createClient(provider);
            client.initialize({ host: url, token, ...otherOptions });

            return createGitService(client, {}, app.logger);

        });

        app.registerService(name, service);
    },
};