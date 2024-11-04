import { _, eachAsync_, batchAsync_ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';

/**
 * Enable a service group
 * @module Feature_ServiceGroup
 */

export default {
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
     * // serviceName: s3DigitalOcean.instance1
     * serviceGroup: { 's3DigitalOcean': { 'instance1': {  } }   }
     */
    load_: async function (app, services) {
        let features = [];
        const instancesMap = {};

        await eachAsync_(services, async (instances, serviceName) => {
            let feature = await app._loadFeature_(serviceName);
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
            await batchAsync_(instances, async (serviceOptions, instanceName) => {
                const fullName = `${feature.name}.${instanceName}`;
                const { load_, ...others } = feature;
                await load_(app, serviceOptions, fullName);
                others.enabled = true;
                app.features[fullName] = others;
            });
        });
    },
};
