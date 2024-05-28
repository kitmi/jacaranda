/**
 *
 * @param {Command} cli
 */ "use strict";
module.exports = (cli)=>{
    cli.allowUnknownOption().option('-h, --help').action((options)=>{
        console.log(options);
    });
};

//# sourceMappingURL=general.js.map