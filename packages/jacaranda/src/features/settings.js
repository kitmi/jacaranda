/**
 * Enable customized settings
 * @module Feature_Settings
 * @example
 * "settings": {
 *     "key": 1,
 *     "env:development": {
 *         "key": 2
 *     },
 *     "stage:ppe": {
 *         "key": 3
 *     }
 * }
 */

import { InvalidConfiguration } from '@kitmi/types';
import { _, isPlainObject } from '@kitmi/utils';
import Feature from '../Feature';
import runtime, { K_ENV } from '../runtime';
import { getNodeEnv } from '../ServiceContainer';

const KEY_ENV = 'env:';
const KEY_STAGE = 'stage:';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Customized settings
     * @returns {Promise.<*>}
     */
    load_: function (app, settings) {
        const Stage = runtime.get(K_ENV)?.STAGE;

        let result = {};
        let envSettings;
        let stageSettings;

        _.each(settings, (value, key) => {
            if (key.startsWith(KEY_ENV)) {
                let envKey = key.substring(KEY_ENV.length);
                if (envKey === getNodeEnv()) {
                    envSettings = value;
                    if (!isPlainObject(value)) {
                        throw new InvalidConfiguration('Invalid env settings', app, `settings.${key}`);
                    }
                }
            } else if (Stage && key.startsWith(KEY_STAGE)) {
                let stageKey = key.substring(KEY_ENV.length);
                if (stageKey === Stage) {
                    stageSettings = value;
                    if (!isPlainObject(value)) {
                        throw new InvalidConfiguration('Invalid stage settings', app, `settings.${key}`);
                    }
                }
            } else {
                result[key] = value;
            }
        });

        app.settings = Object.assign(result, envSettings, stageSettings);
    },
};
