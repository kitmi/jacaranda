exports.Commands = {   
    'clean': 'Remove auto-generated files.',
    'build': 'Generate database scripts and entity models.',
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
            break;

        case 'migrate':
            cmdOptions['r'] = {
                desc: 'Reset all data if the database exists',
                promptMessage: 'Reset existing database?',
                promptDefault: false,
                inquire: true,
                required: true,
                alias: [ 'reset' ],
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
                alias: [ 'ds', 'data' ],
                required: true                
            };
            cmdOptions['ignore'] = {
                desc: 'Ignore exception on duplicate',                
                alias: [ 'ignore-duplicate' ],
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
                alias: [ 'O' ],
                bool: true
            };            
            break;

        default:
            //module general options
            break;
    }

    return cmdOptions;
};

