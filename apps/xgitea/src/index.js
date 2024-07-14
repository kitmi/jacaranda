const { startCommand } = require('@kitmi/jacaranda');
const { _, findKey } = require('@kitmi/utils');
const pkg = require('../package.json');

const { commands, getCommandOptions, commandHandlers } = require('./commands');
const figlet = require('figlet');

const binItem = findKey(pkg.bin, (v) => v === 'bin/xeml.js');

const afterCommandConfirmed = (cli) => {
    let cmd = cli.argv._[0];

    let options = getCommandOptions(cli, cmd);
    cli.usage.options = { ...cli.usage.options, ...options };
    cli.parse(cli.usage.options);
    cli.argv._ = [cmd];
};

function main() {
    return startCommand(
        async (app) => {
            const cmd = app.commandLine;

            if (cmd.option('help')) {
                cmd.showUsage();
                return;
            }

            if (cmd.option('version')) {
                console.log(pkg.version);
                return;
            }

            if (!process.env.GITEA_URL || !process.env.GITEA_ACCESS_TOKEN) {
                throw new Error('GITEA_URL and GITEA_ACCESS_TOKEN environment variables must be set.');
            }

            const command = cmd.argv._[0];
            let cmdMethod_ = commandHandlers[command];

            try {
                await cmdMethod_(app);
            } catch (error) {
                app.log('error', error.message);
                process.exit(1);
            }
        },
        {
            //throwOnError: true,
            commandName: binItem,
            config: {
                featureRegistry: {
                    gitea: ['@kitmi/feat-devops', 'gitea'],
                },
                version: pkg.version,
                commandLine: {
                    banner: () => {
                        return (
                            figlet.textSync('XGent . ai', {
                                horizontalLayout: 'fitted',
                            }) +
                            '\n' +
                            `Jacaranda gitea command-line tool v${pkg.version}`
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
                            choicesProvider: _.map(commands, (desc, cmd) => ({ name: `${cmd} - ${desc}`, value: cmd })),
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
                        owner: {
                            desc: 'The owner of the repository',
                            inquire: true,
                            required: true,
                        },

                        repo: {
                            desc: 'The repository name',
                            inquire: true,
                            required: true,
                        },
                    },
                    silentMode: (cli) => cli.argv['silent'] || cli.argv['version'] || cli.argv['help'],
                    nonValidationMode: (cli) => cli.argv['version'] || cli.argv['help'],
                    showUsageOnError: true,
                    showArguments: (cli) => cli.argv['verbose'],
                },
                gitea: {
                    url: process.env.GITEA_URL,
                    token: process.env.GITEA_ACCESS_TOKEN,
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
