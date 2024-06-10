const { startWorker } = require('@kitmi/jacaranda');
const { dataSource, dataModel, db } = require('@kitmi/data');

async function run(cli, command) {
    let configPath = cli.option('c');
    let configName = cli.option('cn');
    let configType = cli.option('ct');

    let cmdMethod_ = require('../commands/' + command);

    await startWorker(cmdMethod_, {
        throwOnError: true,
        configPath,
        configType,
        configName,
        verbose: cli.option('verbose'),
        disableEnvAwareConfig: !cli.option('ec'),

        registry: {
            features: {
                dataModel,
                dataSource,
                db
            },
        },

        argv: cli.argv
    });
}

module.exports = run;
