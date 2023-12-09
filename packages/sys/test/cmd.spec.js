import { run_, runLive_, runSync } from '../src/cmd';

describe('unit:cmd', function () {
    it('should execute a shell command asynchronously', async () => {
        const result = await run_('echo hello');
        result.stdout.trim().should.equal('hello');
    });

    it('should reject the promise if the command fails', async () => {
        try {
            await run_('invalid command');
            should.not.exist('here');
        } catch (error) {
            error.message.should.match(/command not found/);
        }
    });

    it('should accept options to pass to child_process.exec', async () => {
        const result = await run_('echo $MY_VAR', { env: { MY_VAR: 'jacaranda' } });
        result.stdout.trim().should.equal('jacaranda');
    });

    it('cmd live', async function () {
        const code = await runLive_('ls', ['-l']);
        code.should.be.eql(0);
    });

    it('cmd live 2', async function () {
        await runLive_(
            'ls',
            ['-l'],
            (data) => {
                console.log('stdout', data.toString());
            },
            (data) => {
                console.error('stderr', data.toString());
            }
        );
    });

    it('should execute a shell command synchronously', () => {
        const result = runSync('echo hello');
        result.trim().should.equal('hello');
    });

    it('should throw an error if the command fails', () => {
        (() => runSync('invalid command')).should.throws();
    });

    it('should accept options to pass to child_process.execSync', () => {
        const result = runSync('echo hello', { encoding: 'utf8' });
        result.trim().should.equal('hello');
    });
});
