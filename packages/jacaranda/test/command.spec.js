import capcon from 'capture-console';
import { startCommand } from '../src';

describe('starters:command', function () {
    it('start', async function () {
        let output = '';

        capcon.startCapture(process.stdout, function (stdout) {
            output += stdout;
        });

        await startCommand(
            () => {
                console.log('Hello CLI');
            },
            {
                commandName: 'testcli',
                loadConfigFromOptions: true,
                config: {
                    commandLine: {
                        banner: 'Test',
                    },
                },
            }
        );

        capcon.stopCapture(process.stdout);

        output.trim().should.be.equal(`Test

Hello CLI`);
    });
});
