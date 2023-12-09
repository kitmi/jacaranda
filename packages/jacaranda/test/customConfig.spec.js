import { startWorker } from '../src';
import pkg from '../package.json';

describe('feature:customConfig', function () {
    it('test', async function () {
        await startWorker(
            async (app) => {
                app.version.should.be.equal(pkg.version);
                process.env.MY_VAR.should.be.equal('Hello');
            },
            { verbose: true, configPath: 'test/conf', configName: 'test-custom' }
        );
    });
});
