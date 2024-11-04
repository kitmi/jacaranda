# @kitmi/jacaranda

## JavaScript Application Framework

`@kitmi/jacaranda` is a rich-feature JavaScript CLI application and http server application framework with plugable features. It supports to run by both `node.js` and `bun.sh`, and switch between `koa.js` (stable) and `hono.js` (high performance) as the http engine freely.

## Philosophy

-   Every top-level node in the configuration file is a feature.
-   Every feature is an injected dependency.
-   A feature can register a service (recommended) or extend the app prototype.
-   Features are loaded on different stages from CONF -> INIT -> SERVICE -> PLUGIN -> FINAL. They are also loaded according to their dependency relation in the same stage.
-   Features include built-in features and all custom features under the app's features directory (configurable in app options through the constructor of App or startWorker argument)
-   Configuration is environment awareness, the default one is `<configName>.default.json`. If the app is run under `NODE_ENV=development`, the `<configName>.development.json` if exist will override the default one.
-   Configuration can also be overridden by CONF level features.

## Built-in features

-   Configuration related

    -   configByGitUser
    -   configByHostname
    -   customConfig

-   App general

    -   serviceGroup
    -   i18n
    -   libModules
    -   featureRegistry (supports feature in node_modules)
    -   jwt
    -   nanoid
    -   env
    -   settings
    -   version

-   Http client

    -   fetchAgent
    -   superAgent
    -   superTest (for code coverage test)

-   Logger

    -   logger (changed from winston to pino)

-   CLI interface
    -   commandLine

## Worker starters

-   general worker
-   rich args & opts cli
-   loop worker
-   mq worker (will be upgraded to remove the dependency on specific MQ lib)

## Examples

See test case for more examples

### 1. CLI app

A command line app with a required argument and several options. It will prompt user to input the argument if user does not provide.

```js
import { startCommand } from '@kitmi/jacaranda';

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
                testArgs: ['-s', 'test'],
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
```

### 2. General worker

A seed.js for seeding prisma datasource.

```js
import { startWorker } from '@kitmi/jacaranda';
import { fs } from '@kitmi/sys';
import { eachAsync_ } from '@kitmi/utils';
import path from 'node:path';

const initIndexFile = path.resolve(__dirname, './init/index.list');
const initDir = path.resolve(__dirname, './init');

startWorker(
    async (app) => {
        const prisma = app.getService('prisma');

        const initIndex = await fs.readFile(initIndexFile, 'utf-8');
        const files = initIndex.split('\n');

        await eachAsync_(files, async (file) => {
            const { default: init } = await import(path.join(initDir, file));
            await init(app, prisma);
        });
    },
    {
        configName: 'worker',
        logLevel: 'verbose',
        sourcePath: 'server',
    }
);
```

## License

-   MIT
-   Copyright (c) 2023 KITMI PTY LTD
