const path = require('node:path');
const { startCommand } = require('@kitmi/jacaranda');
const { _, findKey } = require('@kitmi/utils');
const pkg = require('../../package.json');

const run = require('./run');
const { Commands, getCommandOptions } = require('./commands');
const figlet = require('figlet');

const binItem = findKey(pkg.bin, (v) => v === 'bin/xeml.js');

const afterCommandConfirmed = (cli) => {
    let cmd = cli.argv._[0];

    let options = getCommandOptions(cli, cmd);
    cli.usage.options = { ...cli.usage.options, ...options };
    cli.parse(cli.usage.options);
    cli.argv._ = [cmd];
};

const onConfigSet = (cli) => {
    let configPath = cli.argv['config'];
    const lastDot = configPath.lastIndexOf('.');
    if (lastDot > 0) {
        let ext = configPath.substring(lastDot + 1);
        cli.updateOption('ct', ext);
    }

    const lastSlash = configPath.lastIndexOf(path.sep);
    if (lastSlash > 0) {
        let name = configPath.substring(lastSlash + 1, lastDot > 0 ? lastDot : undefined);
        if (name.endsWith('.default')) {
            name = name.substring(0, name.length - 8);
            cli.updateOption('ec', true);
        }

        cli.updateOption('cn', name);
        configPath = configPath.substring(0, lastSlash);
    }

    cli.updateOption('c', configPath);
};

function main() {
    return startCommand(
        (app) => {
            const cmd = app.commandLine;

            if (cmd.option('help')) {
                cmd.showUsage();
                return;
            }

            if (cmd.option('version')) {
                console.log(pkg.version);
                return;
            }

            const command = cmd.argv._[0];
            return run(cmd, command);
        },
        {
            throwOnError: true,
            commandName: binItem,
            config: {
                version: pkg.version,
                commandLine: {
                    banner: () => {
                        return (
                            figlet.textSync('XGent . ai', {
                                horizontalLayout: 'fitted',
                            }) +
                            '\n' +
                            `Jacaranda data modeling command line v${pkg.version}`
                        );
                    },
                    program: binItem,
                    arguments: [
                        {
                            name: 'command',
                            required: true,
                            inquire: true,
                            promptType: 'list',
                            promptMessage: 'What command are you going to execute?',
                            choicesProvider: _.map(Commands, (desc, cmd) => ({ name: `${cmd} - ${desc}`, value: cmd })),
                            afterInquire: afterCommandConfirmed,
                            onArgumentExists: afterCommandConfirmed,
                        },
                    ],
                    options: {
                        s: {
                            desc: 'Silent mode',
                            alias: ['silent'],
                            bool: true,
                            default: false,
                        },
                        v: {
                            desc: 'Show version information',
                            alias: ['version'],
                            bool: true,
                            default: false,
                        },
                        verbose: {
                            desc: 'Show verbose information',
                            bool: true,
                            default: false,
                        },
                        h: {
                            desc: 'Show usage message',
                            alias: ['help'],
                            bool: true,
                            default: false,
                        },
                        c: {
                            desc: 'Config path',
                            alias: ['conf', 'config', 'config-path'],
                            default: 'conf',
                            afterInquire: onConfigSet,
                            onArgumentExists: onConfigSet,
                        },
                        cn: {
                            desc: 'Config name',
                            alias: ['config-name'],
                            inquire: true,
                            promptDefault: 'model',
                        },
                        ct: {
                            desc: 'Config type',
                            alias: ['config-type'],
                            inquire: true,
                            promptDefault: 'yaml',
                        },
                        ec: {
                            desc: 'Environment-aware config',
                            alias: ['env-aware'],
                            bool: true,
                            inquire: true,
                            promptDefault: true,
                        },
                        allow: {
                            desc: 'Allow features',
                            alias: ['allow-feature'],
                            type: 'list',
                        },
                        fp: {
                            desc: 'Feature(s) path',
                            alias: ['feature-path', 'features-path'],
                        },
                        mp: {
                            desc: 'Model(s) path',
                            alias: ['model-path', 'models-path'],
                        },
                    },
                    silentMode: (cli) => cli.argv['silent'] || cli.argv['version'] || cli.argv['help'],
                    nonValidationMode: (cli) => cli.argv['version'] || cli.argv['help'],
                    showUsageOnError: true,
                    showArguments: (cli) => cli.argv['verbose'],
                },
            },
        }
    );
}

if (!module.parent) {
    main();
} else {
    module.exports = main;
}
