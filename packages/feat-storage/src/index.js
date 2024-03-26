import { Feature } from '@kitmi/jacaranda';
import * as Drivers from './drivers';

const mapOfProviderToDriver = {
    digitalocean: 'S3v2',
    aws: 'S3v3',
    azure: 'Azure',
};

/**
 * General cloud storage feature
 * @module Feature_Storage
 */

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: (app, { provider }) => {
        const Driver = Drivers[mapOfProviderToDriver[provider]];
        return Driver.packages;
    },

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
        const { provider, options: providerOptions } = app.featureConfig(
            options,
            {
                schema: {
                    provider: { type: 'text', enum: Object.keys(mapOfProviderToDriver) },
                    options: { type: 'object', optional: true },
                },
            },
            name
        );

        const Driver = Drivers[mapOfProviderToDriver[provider]];
        const service = new Driver(app, providerOptions);

        app.registerService(name, service);
    },
};
