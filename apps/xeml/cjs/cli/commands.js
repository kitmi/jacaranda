"use strict";
exports.Commands = {
    'init': 'Initialize geml configuration.',
    'clean': 'Remove auto-generated files.',
    'connect': 'Set data source connection.',
    'build': 'Generate database scripts and entity models.',
    'graphql': 'Generate graphql schemas.',
    'migrate': 'Create database structure.',
    'import': 'Import data set.',
    'export': 'Export data from database.',
    'pull': 'Pull schema from a databse.'
};
/**
 * @param {CommandLine} cli - CommandLine object.
 * @param {string} command - Command
 */ exports.getCommandOptions = (cli, command)=>{
    let cmdOptions = {};
    switch(command){
        case 'init':
            cmdOptions['schema'] = {
                desc: 'Default schema to initialize',
                promptMessage: 'Schema name?',
                promptDefault: 'sample',
                inquire: true,
                required: true,
                silentModeDefault: 'sample'
            };
            break;
        case 'connect':
            cmdOptions['schema'] = {
                desc: 'Schema to set up connection',
                promptMessage: 'Schema name?',
                inquire: true,
                required: true
            };
            cmdOptions['dbms'] = {
                alias: [
                    'data-source-type'
                ],
                desc: 'Data source type to connect',
                promptMessage: 'Data source type?',
                promptType: "list",
                inquire: true,
                required: true,
                choicesProvider: [
                    'mysql',
                    'mongodb',
                    'rabbitmq'
                ]
            };
            cmdOptions['ds'] = {
                alias: [
                    'data-source-name'
                ],
                desc: 'Data source name',
                promptMessage: 'Data source name?',
                promptDefault: (cli)=>cli.argv['schema'],
                inquire: true,
                required: true
            };
            cmdOptions['conn'] = {
                alias: [
                    'connection-string'
                ],
                desc: 'Data source connection string (like URL), e.g. mysql://localhost',
                promptMessage: 'Connection string?',
                inquire: true,
                required: true
            };
            break;
        case 'clean':
            cmdOptions['json-only'] = {
                desc: 'Delete intermediate files (JSON files) only',
                bool: true,
                default: false
            };
            break;
        case 'build':
            break;
        case 'graphql':
            break;
        case 'migrate':
            cmdOptions['r'] = {
                desc: 'Reset all data if the database exists',
                promptMessage: 'Reset existing database?',
                promptDefault: false,
                inquire: true,
                required: true,
                alias: [
                    'reset'
                ],
                bool: true
            };
            break;
        case 'import':
            cmdOptions['schema'] = {
                desc: 'The schema to list',
                required: true
            };
            cmdOptions['dataset'] = {
                desc: 'The name of the data set to import',
                alias: [
                    'ds',
                    'data'
                ],
                required: true
            };
            cmdOptions['ignore'] = {
                desc: 'Ignore exception on duplicate',
                alias: [
                    'ignore-duplicate'
                ],
                bool: true
            };
            break;
        case 'export':
            cmdOptions['schema'] = {
                desc: 'The schema to export',
                required: true
            };
            cmdOptions['override'] = {
                desc: 'Override same day output',
                alias: [
                    'O'
                ],
                bool: true
            };
            break;
        case 'pull':
            cmdOptions['schema'] = {
                desc: 'The schema to pull from database',
                required: true
            };
            cmdOptions['override'] = {
                desc: 'Override existing output',
                alias: [
                    'O'
                ],
                bool: true
            };
            break;
        default:
            break;
    }
    return cmdOptions;
};

//# sourceMappingURL=commands.js.map