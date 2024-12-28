import startWorker from './worker';

/**
 * Start a message queue worker.
 * @param {*} queueService
 * @param {*} queueName 
 * @param {Function} worker 
 * @param {object} options
 */
async function startQueueWorker(queueService, queueName, worker, options) {
    return startWorker(
        async (app) => {
            let messageQueue = app.getService(queueService);

            app.log('info', `A queue worker is started and waiting for message on queue "${queueName}" ...`);

            await messageQueue.waitForJob_(queueName, (msg) => worker(app, msg));

            return app;
        },
        { workerName: queueName + 'Worker', ...options, dontStop: true }
    );
}

export default startQueueWorker;
