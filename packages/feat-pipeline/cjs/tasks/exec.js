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
const _allSync = require("@kitmi/validators/allSync");
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
            step.syslog('warn', output);
        } else {
            step.syslog('info', output);
        }
    }, (buf)=>{
        step.syslog('error', trimBuffer(buf));
    }, options);
}
const exec = async (step, settings)=>{
    let { command, ...others } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            command: [
                {
                    type: 'text'
                },
                {
                    type: 'array',
                    elementSchema: {
                        type: 'text'
                    }
                }
            ],
            cwd: {
                type: 'text',
                optional: true
            },
            env: {
                type: 'object',
                optional: true
            },
            timeout: {
                type: 'integer',
                optional: true
            },
            detached: {
                type: 'boolean',
                optional: true
            }
        },
        keepUnsanitized: true
    });
    command = _utils._.castArray(command);
    const variables = step.cloneValues();
    await (0, _utils.eachAsync_)(command, (_command)=>{
        let __command;
        try {
            __command = (0, _utils.esTemplate)(_command, variables);
        } catch (e) {
            throw new Error(`Failed to interpolate command line \`${_command}\`, ${e.message}`);
        }
        return run_(step, others, __command);
    });
};
const _default = exec;

//# sourceMappingURL=exec.js.map