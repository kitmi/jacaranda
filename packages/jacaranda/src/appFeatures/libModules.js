/**
 * Load lib modules
 * @module Feature_LibModules
 *
 * @example
 *
 *  'libModules': {
 *      '<name>': {
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
import { fs, isDir_ } from '@kitmi/sys';
import { InvalidConfiguration } from '@kitmi/types';
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

            let appPath;
            let moduleMeta = app.registry?.libs?.[name];

            if (moduleMeta != null) {
                appPath = moduleMeta.appPath;
            } else if (config.npmModule) {                
                moduleMeta = await app.tryRequire_(name, true); 
                appPath = moduleMeta.appPath;
            } else {
                appPath = path.join(app.libModulesPath, name);
            }

            let exists = (await fs.pathExists(appPath)) && (await isDir_(appPath));
            if (!exists) {
                throw new InvalidConfiguration(`Lib [${name}] not exists.`, app, `libModules.${name}`);
            }

            let lib = new LibModule(app, name, appPath, { registry: moduleMeta?.registry, ...options });       

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
