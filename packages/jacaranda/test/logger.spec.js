import { startWorker } from '../src';

describe('feature:logger', function () {
    it('test', async function () {
        await startWorker(
            async (app) => {
                app.log('info', 'Hello');
                app.log('warn', 'Hello');
                app.log('error', 'Hello');
            },
            { verbose: true, configPath: 'test/conf', configName: 'logger' }
        );
    });
});
