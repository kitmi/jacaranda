import { Feature } from '@kitmi/jacaranda';
import * as Drivers from './drivers';

const mapOfProviderToDriver = {
    digitalocean: 'S3v2',
    aws: 'S3v3',
    azure: 'Azure',
};

function validateOptions(app, options, name) {
    return app.featureConfig(
        options,
        {
            schema: {
                provider: { type: 'boolean', enum: Object.keys(mapOfProviderToDriver) },
            },
        },
        name
    );
}

/**
 * General cloud storage feature
 * @module Feature_Storage
 */

export default function (app, options, name) {
    const { provider } = validateOptions(app, options, name);

    const Driver = Drivers[mapOfProviderToDriver[provider]];

    return {
        stage: Feature.SERVICE,

        groupable: true,

        packages: Driver.packages,

        /**
         * Load the feature
         * @param {App} app - The app module object
         * @param {object} options - Options for the feature
         * @property {string} options.provider - Cloud storage vendor.
         * @property {object} options.options - Storage driver options.
         * @returns {Promise.<*>}
         *
         * @example
         *
         * provider: 'digitalocean',
         * options: {
         *
         * }
         */
        load_: async function (app, options, name) {
            const { options: providerOptions } = validateOptions(app, options, name);

            const service = new Driver(app, providerOptions);

            app.registerService(name, service);
        },
    };
}
