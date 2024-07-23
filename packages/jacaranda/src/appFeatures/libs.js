/**
 * Load libs modules
 * @module Feature_Libs
 *
 * @example
 *
 *  'libs': {
 *      '<alias>': {
 *          npmModule: false, // whether is a npm module
 *          options: { // module options
 *          },
 *          settings: { // can override module defined settings
 *          }
 *      }
 *  }
 */

import path from 'node:path';
import { _, batchAsync_ } from '@kitmi/utils';
import Feature from '../Feature';
import LibModule from '../LibModule';

export default {
    /**
     * This feature is loaded at plugin stage.
     * @member {string}
     */
    stage: Feature.PLUGIN,

    /**
     * Load the feature.
     * @param {App} app - The app module object.
     * @param {object} entries - Lib module entries.
     * @returns {Promise.<*>}
     */
    load_: async (app, entries) => {
        return batchAsync_(entries, async (config, name) => {
            let options = {
                configType: app.options.configType,
                logLevel: app.options.logLevel,
                ...config.options,
            };

            let { appPath, moduleMeta } = await app.tryLoadModule_(
                config,
                config.name ?? name,
                app.libModulesPath,
                `libs.[${name}]`
            );

            let lib = new LibModule(app, name, appPath, { ...options, ...moduleMeta?.options, registry: moduleMeta?.registry });       

            lib.once('configLoaded', () => {
                if (!_.isEmpty(config.settings)) {
                    lib.config.settings = { ...lib.config.settings, ...config.settings };
                    app.log('verbose', `Lib settings of [${lib.name}] is overrided.`);
                }
            });

            let relativePath = path.relative(app.workingPath, appPath);
            app.log('verbose', `Loading lib [${lib.name}] from "${relativePath}" ...`);

            await lib.start_();

            app.registerLib(lib);  
            app.log('verbose', `Lib [${lib.name}] is loaded.`);            
        });
    },
};

