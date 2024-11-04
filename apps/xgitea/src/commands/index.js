const pr = require('./pr');
const merge = require('./merge');

exports.commandHandlers = {
    pr,
    merge,
};

exports.commands = {
    pr: 'Create a pull request.',
    merge: 'Merge a pull request.',
};

/**
 * @param {CommandLine} cli - CommandLine object.
 * @param {string} command - Command
 */
exports.getCommandOptions = (cli, command) => {
    if (!(command in exports.commandHandlers)) {
        throw new Error(`Invalid command "${command}".`);
    }

    let cmdOptions = {};

    switch (command) {
        case 'pr':
            cmdOptions['from'] = {
                desc: 'The branch to create the pull request from',
                inquire: true,
                required: true,
                alias: ['from-branch'],
            };

            cmdOptions['to'] = {
                desc: 'The branch to create the pull request to',
                inquire: true,
                required: true,
                alias: ['to-branch'],
            };

            const titleDefault = (cmd) => `Auto-created pull request from ${cmd.option('from')} to ${cmd.option('to')}`;

            cmdOptions['title'] = {
                desc: 'The title of the pull request',
                promptDefault: titleDefault,
                silentModeDefault: titleDefault,
                inquire: true,
                required: true,
            };

            cmdOptions['number'] = {
                desc: 'Only output the number of the pull request',
                bool: true,
                alias: ['output-number-only'],
            };

            cmdOptions['merge'] = {
                desc: 'Automatically merge the pull request after creating it',
                bool: true,
                alias: ['auto-merge'],
            };
            break;

        case 'merge':
            cmdOptions['pr'] = {
                desc: 'The pull request number to merge',
                inquire: true,
                required: true,
                alias: ['pull-request'],
            };
            break;

        default:
            //module general options
            break;
    }

    return cmdOptions;
};
