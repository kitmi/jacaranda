const { startWorker } = require('@kitmi/jacaranda');
const model = require('../features/model');
const { dataSource } = require('@kitmi/feat-db');

async function run(cli, command) {
    let configPath = cli.option('c');
    let configName = cli.option('cn');
    let configType = cli.option('ct');

    let cmdMethod_ = require('../commands/' + command);

    return startWorker(cmdMethod_, {
        throwOnError: true,
        configPath,
        configType,
        configName,
        verbose: cli.option('verbose'),
        disableEnvAwareConfig: !cli.option('ec'),

        registry: {
            features: {
                model,
                dataSource
            },
        },
    });
}

module.exports = run;
