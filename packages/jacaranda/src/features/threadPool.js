import { Worker } from 'node:worker_threads';
import { InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';

const recreateWorkerError = (sourceError) => {
    const error = new Error(sourceError.message);

    for (const [key, value] of Object.entries(sourceError)) {
        if (key !== 'message') {
            error[key] = value;
        }
    }

    return error;
};

let poolIdCounter = 0;

export class WorkerPool {
    constructor(app, options) {
        const Deque = app.tryRequire('collections/deque');
        const { name, workerFile, lowThreadNum, highThreadNum, workerOptions } = options;

        this.app = app;
        this.workerFile = workerFile;
        this.lowThreadNum = lowThreadNum;
        this.highThreadNum = highThreadNum;
        this.workerOptions = workerOptions;
        this.poolId = poolIdCounter++;
        this.name = name ?? `${this.app.name}_tp${this.poolId}`;
        this.taskIdCounter = 0;
        this.tasks = new Map();
        this.idleWorkers = new Deque();
        this.busyWorkers = new Map();

        if (lowThreadNum > 0) {
            for (let i = 0; i < lowThreadNum; i++) {
                this.createWorker(true);
            }
        }
    }

    createWorker(idle) {
        const worker = new Worker(this.workerFile, this.workerOptions);

        worker.on('message', (message) => {
            if (message.id === '$CALLBACK') {
                const { task, payload } = message;
                const handler = this.handlers?.[task];

                if (handler == null) {
                    throw new Error(`Unknown callback task "${task}".`);
                }

                Promise.resolve(handler(payload)).catch(this.app.logError);
            } else {
                const task = this.tasks.get(message.id);
                if (task) {
                    this.tasks.delete(message.id);

                    const workerContext = this.busyWorkers.get(worker.threadId);
                    workerContext.ongoing--;

                    if (workerContext.ongoing === 0) {
                        worker.unref();
                        this.busyWorkers.delete(worker.threadId);

                        if (this.idleWorkers.length < this.lowThreadNum) {
                            this.idleWorkers.push(worker);
                        } else {
                            worker.terminate();
                        }
                    }

                    if (message.error == null) {
                        task.resolve(message.value);
                    } else {
                        task.reject(recreateWorkerError(message.error));
                    }
                }
            }
        });

        worker.on('error', (error) => {
            // Any error here is effectively an equivalent of segfault, and have no scope, so we just throw it on callback level
            throw error;
        });

        if (idle) {
            this.idleWorkers.push(worker);
        }

        return worker;
    }

    getNextWorker() {
        // If we have idle workers, just use them
        if (this.idleWorkers.length > 0) {
            const worker = this.idleWorkers.shift();
            this.busyWorkers.set(worker.threadId, { ongoing: 1, worker });
            return worker;
        }

        // If we have less than highThreadNum workers, create a new one
        if (this.busyWorkers.size < this.highThreadNum) {
            const worker = this.createWorker();
            this.busyWorkers.set(worker.threadId, { ongoing: 1, worker });
            return worker;
        }

        // Otherwise, just use the first worker
        const [workerThreadId, workerContext] = this.busyWorkers.entries().next().value;
        workerContext.ongoing++;
        this.busyWorkers.delete(workerThreadId);
        this.busyWorkers.set(workerThreadId, workerContext);
        return workerContext.worker;
    }

    async runTask_(task, payload, transferList) {
        return new Promise((resolve, reject) => {
            const taskId = this.taskIdCounter++;
            this.tasks.set(taskId, { resolve, reject });

            const worker = this.getNextWorker();

            worker.ref();
            worker.postMessage({ id: taskId, task, payload }, transferList);
        });
    }

    setCallbackHandlers(handlers) {
        this.handlers = { ...this.handlers, ...handlers };
    }
}

/**
 * Thread pool to run tasks in parallel
 * @module Feature_ThreadPool
 */

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['collections'],

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} [options] - Options for the feature
     * @returns {Promise.<void>}
     *
     */
    load_: async function (app, options, name) {
        options = app.featureConfig(
            options,
            {
                schema: {
                    name: { type: 'text', optional: true },
                    workerFile: { type: 'text' },
                    workerOptions: { type: 'object', optional: true },
                    lowThreadNum: { type: 'integer', default: 0 },
                    highThreadNum: { type: 'integer', default: 1 },
                },
                keepUnsanitized: true,
            },
            name
        );

        const { lowThreadNum, highThreadNum } = options;

        if (highThreadNum < lowThreadNum) {
            throw new InvalidConfiguration(
                '"highThreadNum" must be greater than or equal to "lowThreadNum".',
                app,
                `${name}.highThreadNum`
            );
        }

        if (highThreadNum === 0) {
            throw new InvalidConfiguration('"highThreadNum" must be greater than 0.', app, `${name}.highThreadNum`);
        }

        const pool = new WorkerPool(app, options);

        app.on('stopping', async () => {
            for (const worker of pool.idleWorkers) {
                worker.terminate();
            }

            for (const { worker } of pool.busyWorkers.values()) {
                worker.terminate();
            }
        });

        app.registerService(name, pool);
    },
};
