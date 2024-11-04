import { Feature } from '@kitmi/jacaranda';
import Pipeline, { normalizeSteps } from './Pipeline';

export default {
    stage: Feature.PLUGIN,

    groupable: true,

    packages: ['mime'],

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} options - Options for the feature
     * @property {string} options.taskProvider - Task provider.
     * @property {object} options.stepLogger - Logger used during step.
     * @returns {Promise.<*>}
     *
     * @example
     *
     * provider: 'digitalocean',
     * options: {
     *
     * }
     */
    load_: async function (app, options, name) {
        let { taskProvider, stepLogger } = app.featureConfig(
            options,
            {
                schema: {
                    taskProvider: { type: 'text' },
                    stepLogger: { type: 'text', optional: true, default: 'logger' },
                },
            },
            name
        );

        app.requireServices([taskProvider, stepLogger]);

        const service = {
            create(name, steps, env) {
                const _steps = normalizeSteps(steps);

                return async (input, variables) => {
                    const pipeline = new Pipeline(app, name, _steps, { env, taskProvider, stepLogger });
                    if (variables) {
                        pipeline.setVariables(variables);
                    }
                    return [pipeline, await pipeline.run_(input)];
                };
            },
        };

        app.registerService(name, service);
    },
};
