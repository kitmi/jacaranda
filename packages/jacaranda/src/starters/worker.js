import App from '../App';

/**
 * Start a worker app
 * @param {Function} worker
 * @param {object} [workerOptions]
 * @property {string} [workerOptions.workerName]
 * @property {boolean} [workerOptions.dontStop] - Don't stop after worker done
 * @property {Function} [workerOptions.initializer]
 */
async function startWorker(worker, options) {
    const { workerName, dontStop, initializer, uninitializer, throwOnError, verbose, ...appOptions } = options || {};

    if (verbose) {
        appOptions.logLevel = 'verbose';
    }

    // create an app instance with custom configuration
    let app = new App(workerName || 'worker', appOptions);

    try {
        await app.start_();

        if (initializer) {
            await initializer(app);
        }

        const result = await worker(app);

        if (dontStop) {
            process.once('SIGINT', () => {
                app.stop_();
            });
        } else {
            await app.stop_();
        }

        if (uninitializer) {
            await uninitializer();
        }

        return result;
    } catch (error) {
        if (throwOnError) {
            throw error;
        }

        // eslint-disable-next-line no-undef
        console.error(verbose ? error : error.message);

        process.exit(1);
    }
}

export default startWorker;
