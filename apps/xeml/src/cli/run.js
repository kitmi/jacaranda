const path = require('node:path');
const { startWorker } = require('@kitmi/jacaranda');
const { dataSource, dataModel, db } = require('@kitmi/data');

async function run(cli, command) {
    let configPath = cli.option('c');
    let configName = cli.option('cn');
    let configType = cli.option('ct');

    if (cli.option('w')) {
        process.chdir(path.resolve(cli.option('w')));
    }

    const verboseMode = cli.option('verbose');

    let cmdMethod_ = require('../commands/' + command);

    try {
        await startWorker(cmdMethod_, {
            workerName: `${cli.app.name}:${command}`,
            configPath,
            configType,
            configName,
            verbose: verboseMode,
            disableEnvAwareConfig: !cli.option('ec'),
            throwOnError: true,

            registry: {
                features: {
                    dataModel,
                    dataSource,
                    db,
                },
            },

            argv: cli.argv,
        });
    } catch (error) {
        if (verboseMode) {
            cli.app.logError(error);
        } else {
            cli.app.log('error', error.message || error);
        }
        process.exit(1);
    }
}

module.exports = run;
