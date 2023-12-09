import { startCommand } from '../src';

async function main() {
        let output = '';

        /*
        capcon.startCapture(process.stdout, function (stdout) {
            output += stdout;
        });
        */

        const cliName = 'test';
        const version = 'v1.0.0';

        await startCommand(
            (app) => {
                const cmd = app.commandLine;

                if (cmd.option('help')) {
                    cmd.showUsage();
                    return;
                }

                if (cmd.option('version')) {
                    console.log(app.version);
                    return;
                }

                const arg1 = cmd.argv._[0];

                console.log(`Hello, ${arg1}!`);
            },
            {
                // process.env.NODE_ENV === 'development' ? 'verbose' : 'info'
                logLevel: 'info',
                commandName: cliName,
                config: {                    
                    version: version,
                    commandLine: {
                        testArgs: [ '-s', 'test' ],
                        banner: () => {
                            return `Cli description v${version}`;
                        },
                        program: cliName,
                        arguments: [
                            {
                                name: 'argrument1',
                                required: true,
                                inquire: true, // if true, the argument will be asked in non-silense mode if not provided
                                promptMessage: 'Please enter the argument1:', // prompt message in interactive mode
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
                            h: {
                                desc: 'Show usage message',
                                alias: ['help'],
                                bool: true,
                                default: false,
                            },
                        },
                        // conditions to make the cli run in silent mode
                        silentMode: (cli) => cli.argv['silent'] || cli.argv['version'] || cli.argv['help'],
                        // conditions to make the cli run without arguments validation
                        nonValidationMode: (cli) => cli.argv['version'] || cli.argv['help'],
                        // whether to show usage information on invalid arguments error
                        showUsageOnError: true,
                        // debug option to show all processed arguments
                        showArgs: false,
                    },
                },
            }
        );

        //capcon.stopCapture(process.stdout);

        //console.log(output.trim());
    }

main();