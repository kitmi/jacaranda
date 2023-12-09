/**
 * Enable developer specific config identified by git user name.
 * @module Feature_ConfigByGitUser
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
     * @property {string} [options.fallbackName] - Fallback username for git user not available
     * @returns {Promise.<*>}
     */
    load_: async (app, options) => {
        let devName;

        try {
            devName = (await run_('git config --global user.email')).trim();
        } catch (e) {
            app.log('warn', e.message || e);
        }

        if (!devName || devName === '') {
            if (options.fallbackName) {
                devName = options.fallbackName;
            } else {
                app.log('warn', 'Unable to read "user.email" of git config and no fallback option is configured.');
                return;
            }
        }

        devName = devName.substring(0, devName.indexOf('@'));

        const devConfigFile = path.join(
            app.configPath,
            app.configName + '.' + devName + (app.options.configType === 'yaml' ? '.yaml' : '.json')
        );
        if (!fs.existsSync(devConfigFile)) {
            app.log('warn', `Developer specific config file "${devConfigFile}" does not exist and will use defaults.`);
            return;
        }

        app.configLoader.provider =
            app.options.configType === 'yaml'
                ? new YamlConfigProvider(devConfigFile)
                : new JsonConfigProvider(devConfigFile);
        return app.loadConfig_();
    },
};
