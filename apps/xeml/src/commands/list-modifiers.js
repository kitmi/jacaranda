const { Activators, Processors, Validators } = require('@kitmi/data');
const chalk = require('chalk');

/**
 * Build database scripts and entity models from oolong files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} list-modifiers`);

    let output = `\n${chalk.yellow.bold("Activators:")}\n`;
    Object.keys(Activators).map((name) => {
        output += `  ${chalk.cyanBright(name)}\n`;
    });

    output += `\n${chalk.yellow.bold("Processors:")}\n`;
    Object.keys(Processors).map((name) => {
        output += `  ${chalk.magentaBright(name)}\n`;
    });

    output += `\n${chalk.yellow.bold("Validators:")}\n`;
    Object.keys(Validators).map((name) => {
        output += `  ${chalk.greenBright(name)}\n`;
    });

    console.log(output);
};
