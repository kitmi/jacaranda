/**
 * Enable server specific config identified by host name.
 * @module Feature_ConfigByHostname
 */

import path from 'node:path';
import { fs, run_ } from '@kitmi/sys';
import { JsonConfigProvider, YamlConfigProvider } from '@kitmi/config';
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
     * @param {object} options - Options for the feature
     * @property {string} [options.fallbackName] - Fallback name if hostname not available
     * @returns {Promise.<*>}
     */
    load_: async (app, options) => {
        let hostName;

        try {
            hostName = (await run_('hostname')).trim();
        } catch (e) {
            app.log('warn', e.message || e);
        }

        if (!hostName) {
            throw new Error('Unable to read "hostname" from environment.');
        }

        let hostSpecConfigFile = path.join(
            app.configPath,
            app.configName + '.' + hostName + (app.options.configType === 'yaml' ? '.yaml' : '.json')
        );
        if (!fs.existsSync(hostSpecConfigFile)) {
            if (options.fallbackName) {
                hostName = options.fallbackName;
                let hostSpecConfigFileFb = path.join(
                    app.configPath,
                    app.configName + '.' + hostName + (app.options.configType === 'yaml' ? '.yaml' : '.json')
                );

                if (!fs.existsSync(hostSpecConfigFileFb)) {
                    throw new Error(
                        `The specific config file for host [${hostName}] not found and the fallback config [${hostSpecConfigFileFb}] not found either.`
                    );
                }

                hostSpecConfigFile = hostSpecConfigFileFb;
            } else {
                app.log(
                    'warn',
                    `The specific config file for host [${hostName}] not found and no fallback setting. Use defaults.`
                );
                return;
            }
        }

        app.configLoader.provider =
            app.options.configType === 'yaml'
                ? new YamlConfigProvider(hostSpecConfigFile)
                : new JsonConfigProvider(hostSpecConfigFile);
        return app.loadConfig_();
    },
};
