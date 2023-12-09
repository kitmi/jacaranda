"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Enable a service group
 * @module Feature_ServiceGroup
 */ module.exports = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */ stage: _Feature.default.SERVICE,
    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} services - Map of services from service registration to service instance options
     * @returns {Promise.<*>}
     *
     * @example
     *
     * serviceGroup: { 's3DigitalOcean': { '<instanceName>': {  } }   }
     */ load_: async function(app, services) {
        let features = [];
        const instancesMap = {};
        _utils._.each(services, (instances, serviceName)=>{
            let feature = app._loadFeature(serviceName);
            if (!feature.groupable) {
                throw new _types.InvalidConfiguration(`Feature [${serviceName}] is not groupable.`, app, `serviceGroup.${serviceName}`);
            }
            features.push([
                feature
            ]);
            instancesMap[serviceName] = instances;
        });
        features = app._sortFeatures(features);
        await (0, _utils.eachAsync_)(features, async ([feature])=>{
            const instances = instancesMap[feature.name];
            await (0, _utils.batchAsync_)(instances, (serviceOptions, instanceName)=>{
                const fullName = `${feature.name}-${instanceName}`;
                const { load_, ...others } = feature;
                load_(app, serviceOptions, `${feature.name}-${instanceName}`);
                others.enabled = true;
                app.features[fullName] = others;
            });
        });
    }
};

//# sourceMappingURL=serviceGroup.js.map