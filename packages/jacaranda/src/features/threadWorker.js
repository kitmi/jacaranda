import { parentPort } from 'node:worker_threads';
import Feature from '../Feature';

/**
 * Hasher, get the hash of a buffer/string/stream/file.
 * @module Feature_Hasher
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
     * @param {object} [options] - Options for the feature
     * @returns {Promise.<void>}
     */
    load_: async function (app, options, name) {
        const { logMessage, logLevel } = app.featureConfig(
            options,
            {
                schema: {
                    logMessage: { type: 'boolean', default: false },
                    logLevel: { type: 'text', enum: ['info', 'verbose'], default: 'info' },
                },
            },
            name
        );

        const perfCounter = {
            numTasks: 0,
            numTasksCompleted: 0,
            numTasksFailed: 0,
            totalTaskTime: 0,
            averageTaskTime: 0,
            maxTaskTime: 0,
        };

        const service = {
            get perfCounter() {
                return perfCounter;
            },
            start(handlers) {
                if (parentPort) {
                    const callback = (task, payload) => {
                        parentPort.postMessage({ id: '$CALLBACK', task, payload });
                    };

                    parentPort.on('close', async () => {
                        app.log('info', 'Thread worker closed by main thread.');
                        await app.stop_();
                    });
                    parentPort.on('message', async (message) => {
                        perfCounter.numTasks++;
                        const startTime = Date.now();

                        try {
                            if (logMessage) {
                                app.log(logLevel, 'Received message from main thread.', message);
                            }

                            const { id, task, payload } = message;
                            const handler = handlers[task];

                            if (handler == null) {
                                throw new Error(`Unknown task "${task}".`);
                            }

                            const result = await handler(payload, callback);
                            const { value, transferList } = result || {};
                            parentPort.postMessage({ id, value }, transferList);
                            perfCounter.numTasksCompleted++;

                            const endTime = Date.now();
                            const taskTime = endTime - startTime;
                            perfCounter.totalTaskTime += taskTime;
                            perfCounter.averageTaskTime = perfCounter.totalTaskTime / perfCounter.numTasksCompleted;
                            perfCounter.maxTaskTime = Math.max(perfCounter.maxTaskTime, taskTime);
                        } catch (error) {
                            perfCounter.numTasksFailed++;
                            app.logError(error);

                            const newError = { message: error.message, stack: error.stack };

                            for (const [key, value] of Object.entries(error)) {
                                if (typeof value !== 'object') {
                                    newError[key] = value;
                                }
                            }

                            parentPort.postMessage({ id: message.id, error: newError });
                        }
                    });
                } else {
                    throw new Error('This feature can only be used in a worker thread.');
                }
            },
        };

        app.registerService(name, service);
    },
};
