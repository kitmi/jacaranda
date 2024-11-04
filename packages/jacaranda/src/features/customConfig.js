/**
 * Enable custom config identified by config path.
 * @module Feature_CustomConfig
 */

import path from 'node:path';
import { JsonConfigProvider, YamlConfigProvider } from '@kitmi/config';
import { InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at configuration stage
     * @member {string}
     */
    stage: Feature.CONF,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {string} configPath - Custom config file path
     * @returns {Promise.<*>}
     */
    load_: async (app, configPath, name) => {
        const isJson = configPath.endsWith('.json');
        if (isJson) {
            app.configLoader.provider = new JsonConfigProvider(path.resolve(configPath));
        } else {
            const isYaml = configPath.endsWith('.yaml');
            if (isYaml) {
                app.configLoader.provider = new YamlConfigProvider(path.resolve(configPath));
            } else {
                throw new InvalidConfiguration(`Unsupported config file type: ${configPath}`, app, name);
            }
        }

        return app.loadConfig_();
    },
};
