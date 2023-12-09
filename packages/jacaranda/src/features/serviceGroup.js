import { _, eachAsync_, batchAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';

/**
 * Enable a service group
 * @module Feature_ServiceGroup
 */

module.exports = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} services - Map of services from service registration to service instance options
     * @returns {Promise.<*>}
     *
     * @example
     *
     * serviceGroup: { 's3DigitalOcean': { '<instanceName>': {  } }   }
     */
    load_: async function (app, services) {
        let features = [];
        const instancesMap = {};

        _.each(services, (instances, serviceName) => {
            let feature = app._loadFeature(serviceName);
            if (!feature.groupable) {
                throw new InvalidConfiguration(
                    `Feature [${serviceName}] is not groupable.`,
                    app,
                    `serviceGroup.${serviceName}`
                );
            }

            features.push([feature]);
            instancesMap[serviceName] = instances;
        });

        features = app._sortFeatures(features);

        await eachAsync_(features, async ([feature]) => {
            const instances = instancesMap[feature.name];
            await batchAsync_(instances, (serviceOptions, instanceName) => {
                const fullName = `${feature.name}-${instanceName}`;
                const { load_, ...others } = feature;
                load_(app, serviceOptions, `${feature.name}-${instanceName}`);
                others.enabled = true;
                app.features[fullName] = others;
            });
        });
    },
};
