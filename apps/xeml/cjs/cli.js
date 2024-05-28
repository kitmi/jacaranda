"use strict";
const { Command } = require('commander');
const commands = require('./commands');
const cli = new Command();
cli.version(require('../package.json').version).option('-c, --config <config>');
commands(cli);
module.exports = cli;

//# sourceMappingURL=cli.js.map