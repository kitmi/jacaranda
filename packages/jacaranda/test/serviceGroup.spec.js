import { startWorker } from '../src';

describe('feature:serviceGroup', function () {
    it('test1', async function () {
        await startWorker(
            async (app) => {
                const test1 = app.getService('superAgent-test1');
                should.exist(test1);

                const result = await test1.get('products');
                //console.log(result);
                should.exist(result);

                result.should.have.keys('products', 'total', 'skip', 'limit');
                Array.isArray(result.products).should.be.ok;
            },
            { verbose: true, configPath: 'test/conf' }
        );
    });

    it('test2', async function () {
        await startWorker(
            async (app) => {
                const test2 = app.getService('superAgent-test2');
                should.exist(test2);

                const result = await test2.get('/api/users', { page: 2 });
                //console.log(result);
                should.exist(result);

                result.should.have.keys('page', 'per_page', 'total', 'total_pages', 'data');
            },
            { verbose: true, configPath: 'test/conf' }
        );
    });
});
