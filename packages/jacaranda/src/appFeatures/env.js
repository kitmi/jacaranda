/**
 * Enable app customized env variables
 * @module Feature_Env
 */

import Feature from '../Feature';
import runtime, { K_ENV } from '../runtime';
import { _ } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.CONF,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} envSettings - Customized env settings
     * @property {array} [envSettings.expose] - Expose env variables from process.env into runtime
     * @property {object} [envSettings.add] - Add env variables
     * @returns {void}
     */
    load_: function (app, envSettings, name) {
        let { expose, add } = app.featureConfig(
            envSettings,
            {
                schema: {
                    expose: { type: 'array', optional: true },
                    add: { type: 'object', optional: true },
                },
            },
            name
        );

        //todo: encrypt sensitive env variables

        expose = new Set(expose || []);
        expose.add('NODE_ENV');
        expose.add('STAGE_ENV');

        if (add?.NODE_ENV) {
            throw new InvalidConfiguration('NODE_ENV cannot be added', app, `${name}.add.NODE_ENV`);
        }

        const asDefaultOnly = true; // for running worker app within a server, usually test only
        const exposed = _.pick(process.env, Array.from(expose));
        runtime.register(K_ENV, { ...exposed, ...add }, asDefaultOnly);

        app.once('stopped', () => {
            runtime.deregister(K_ENV);
        });

        return app.loadConfig_();
    },
};
