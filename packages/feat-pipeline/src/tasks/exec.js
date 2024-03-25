import { _, eachAsync_ } from '@kitmi/utils';
import { cmd } from '@kitmi/sys';

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
    const options = _.pick(settings, ['cwd', 'env', 'timeout', 'detached']);

    const [program, ...args] = command.split(' ');

    return cmd.runLive_(
        program,
        args,
        (buf) => {
            let output = trimBuffer(buf);

            if (_.trimStart(output).substring(0, 4).toLocaleLowerCase() === 'warn') {
                step.stepLog('warn', output);
            } else {
                step.stepLog('info', output);
            }
        },
        (buf) => {
            step.stepLog('error', trimBuffer(buf));
        },
        options
    );
}

const esTemplateSetting = {
    interpolate: /\$\{([\s\S]+?)\}/g,
};

const exec = async (step, settings) => {
    let { command, ...others } = settings;
    command = _.castArray(command);

    const variables = step.cloneValues();

    await eachAsync_(command, (_command) => {
        let __command;
        try {
            __command = _.template(_command, esTemplateSetting)(variables);
        } catch (e) {
            throw new Error(`Failed to interpolate command line \`${_command}\`, ${e.message}`);
        }
        return run_(step, others, __command);
    });
};

export default exec;
