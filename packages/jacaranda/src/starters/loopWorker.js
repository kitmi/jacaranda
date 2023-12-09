import { sleep_ } from '@kitmi/utils';
import startWorker from './worker';

/**
 *
 * @param {Function} worker
 * @param {object} options
 * @property {integer} [options.interval=1000]
 */
async function startLoopWorker(worker, options) {
    let { interval, ...workerOptions } = { interval: 1000, throwOnError: true, ...options };

    return startWorker(async (app) => {
        process.on('SIGINT', () => {
            app.stop_()
                .then(() => {})
                .catch((error) => console.error(error.message || error));
        });

        let lastResult;

        while (app.started) {
            lastResult = await worker(app, lastResult);
            if (app.started) {
                await sleep_(interval);
            }
        }

        return lastResult;
    }, workerOptions);
}

export default startLoopWorker;
