exports.Commands = {
    'clean': 'Remove auto-generated files.',
    'list-modifiers': 'List built-in modifiers.',
    'build': 'Generate database scripts and entity models.',
    'build-api': 'Generate API source code.',
    'export-api': 'Export API metadata.',
    'import-api': 'Import API metadata into database.',
    'migrate': 'Create database structure.',
    'import': 'Import data set.',
};

/**
 * @param {CommandLine} cli - CommandLine object.
 * @param {string} command - Command
 */
exports.getCommandOptions = (cli, command) => {
    let cmdOptions = {};

    switch (command) {
        case 'clean':
            cmdOptions['json-only'] = {
                desc: 'Delete intermediate files (JSON files) only',
                bool: true,
                default: false,
            };
            break;

        case 'build':
        case 'build-api':
            break;

        case 'import-api':
            cmdOptions['from'] = {
                desc: 'The api exported files path',
                alias: ['from-path'],
                default: './migrations/api',
            };
            break;

        case 'export-api':
            cmdOptions['o'] = {
                desc: 'The output path',
                alias: ['output', 'output-path'],
                default: './migrations/api',
            };
            cmdOptions['proj'] = {
                desc: 'The project id',
                alias: ['project', 'project-id'],
                required: true,
            };
            break;

        case 'migrate':
            cmdOptions['r'] = {
                desc: 'Reset all data if the database exists',
                promptMessage: 'Reset existing database?',
                promptDefault: false,
                inquire: true,
                required: true,
                alias: ['reset'],
                bool: true,
            };
            break;

        case 'import':
            cmdOptions['schema'] = {
                desc: 'The schema to list',
                required: true,
            };
            cmdOptions['dataset'] = {
                desc: 'The name of the data set to import',
                alias: ['ds', 'data'],
                required: true,
            };
            cmdOptions['ignore'] = {
                desc: 'Ignore exception on duplicate',
                alias: ['ignore-duplicate'],
                bool: true,
            };
            break;

        case 'export':
            cmdOptions['schema'] = {
                desc: 'The schema to export',
                required: true,
            };
            cmdOptions['override'] = {
                desc: 'Override same day output',
                alias: ['O'],
                bool: true,
            };
            break;

        default:
            //module general options
            break;
    }

    return cmdOptions;
};
