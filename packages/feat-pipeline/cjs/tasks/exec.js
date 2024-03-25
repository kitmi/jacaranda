"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _sys = require("@kitmi/sys");
function trimBuffer(buf) {
    let output = buf.toString();
    if (output.endsWith('\r\n')) {
        output = output.slice(0, -2);
    } else if (output.endsWith('\n')) {
        output = output.slice(0, -1);
    }
    return output;
}
async function run_(step, settings, command) {
    step.syslog('info', `exec: ${command}`);
    const options = _utils._.pick(settings, [
        'cwd',
        'env',
        'timeout',
        'detached'
    ]);
    const [program, ...args] = command.split(' ');
    return _sys.cmd.runLive_(program, args, (buf)=>{
        let output = trimBuffer(buf);
        if (_utils._.trimStart(output).substring(0, 4).toLocaleLowerCase() === 'warn') {
            step.stepLog('warn', output);
        } else {
            step.stepLog('info', output);
        }
    }, (buf)=>{
        step.stepLog('error', trimBuffer(buf));
    }, options);
}
const esTemplateSetting = {
    interpolate: /\$\{([\s\S]+?)\}/g
};
const exec = async (step, settings)=>{
    let { command, ...others } = settings;
    command = _utils._.castArray(command);
    const variables = step.cloneValues();
    await (0, _utils.eachAsync_)(command, (_command)=>{
        let __command;
        try {
            __command = _utils._.template(_command, esTemplateSetting)(variables);
        } catch (e) {
            throw new Error(`Failed to interpolate command line \`${_command}\`, ${e.message}`);
        }
        return run_(step, others, __command);
    });
};
const _default = exec;

//# sourceMappingURL=exec.js.map