import startWorker from './worker';

async function startCommand(commandHandler, options) {
    let { commandName, ...cmdOptions } = options;
    let workerOptions = { ...cmdOptions, workerName: commandName };
    if (workerOptions.config) {
        workerOptions.loadConfigFromOptions = true;
    }

    return startWorker(commandHandler, workerOptions);
}

export default startCommand;
