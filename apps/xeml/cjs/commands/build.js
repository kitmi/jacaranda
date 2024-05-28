/**
 *
 * @param {Command} cli
 */ "use strict";
module.exports = (cli)=>{
    cli.command('build').allowUnknownOption().action((options)=>{
        console.log('build');
    });
};

//# sourceMappingURL=build.js.map