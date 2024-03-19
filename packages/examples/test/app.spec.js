describe.only('app', function () {
    it('by rule', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            const res = await client.get('/test-app');
            server.info(res);
            expect(res).to.equal(`<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>Test.index</title>
</head>
<body>
    <h1>Hello Swig</h1>
    <br>
    <span>This is a page rendered by swig.</span>
</body>
</html>`);
        });
    });

    it('by module 1', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            let res = await client.get('/test-app/module/action1');
            server.info(res);
            expect(res).to.equal('action1');

            res = await client.post('/test-app/module/action1', { name: 'Jacaranda' });
            server.info(res);
            expect(res).to.equal('you post: Jacaranda');

            res = await client.get('/test-app/module/action2');
            server.info(res);
            expect(res).to.equal('Hello');

            jacat.throw_(() => client.get('/test-app/module/action3'), 'Not Found');

            res = await client.get('/test-app/module/action4');
            server.info(res);
            expect(res).to.equal('dummy');
        });
    });

    it('by module 2', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            let res = await client.get('/test-app/module2/action1');
            server.info(res);
            expect(res).to.equal('action1');

            res = await client.post('/test-app/module2/action1', { name: 'Jacaranda' });
            server.info(res);
            expect(res).to.equal('you post: Jacaranda');

            res = await client.get('/test-app/module2/action2');
            server.info(res);
            expect(res).to.equal('Hello');
        });
    });

    it('by rest', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            let res = await client.get('/test-app/api/book');
            server.info(res);
            expect(res).to.eql([
                {
                    id: 1,
                    title: 'Book 1',
                },
                {
                    id: 2,
                    title: 'Book 2',
                },
            ]);

            res = await client.post('/test-app/api/book', {
                title: 'Book 3',
            });
            server.info(res);
            expect(res).to.eql({
                id: 3,
                title: 'Book 3',
            });

            res = await client.get('/test-app/api/book/1');
            server.info(res);
            expect(res).to.eql({
                id: 1,
                title: 'Book 1',
            });

            res = await client.get('/test-app/api/book/4');
            server.info(res);
            expect(res).to.eql({});

            res = await client.put('/test-app/api/book/2', { title: 'Book updated' });
            server.info(res);
            expect(res).to.eql({
                id: 2,
                title: 'Book updated',
            });

            res = await client.get('/test-app/api/book');
            server.info(res);
            expect(res).to.eql([
                {
                    id: 1,
                    title: 'Book 1',
                },
                {
                    id: 2,
                    title: 'Book updated',
                },
                {
                    id: 3,
                    title: 'Book 3',
                },
            ]);

            res = await client.del('/test-app/api/book/3');
            server.info(res);
            expect(res).to.eql({
                id: 3,
                title: 'Book 3',
            });

            res = await client.get('/test-app/api/book');
            server.info(res);
            expect(res).to.eql([
                {
                    id: 1,
                    title: 'Book 1',
                },
                {
                    id: 2,
                    title: 'Book updated',
                },
            ]);

            res = await client.get('/test-app/api/feature');
            server.info(res);
            expect(res).to.eql({
                param: 'test',
            });
        });
    });

    it('by jsRest', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            let res = await client.get('/test-app/api/v2/product');
            server.info(res);
            expect(res).to.eql({
                status: 'success',
                result: [
                    {
                        id: 1,
                        name: 'product1',
                    },
                    {
                        id: 2,
                        name: 'product2',
                    },
                ],
            });

            res = await client.get('/test-app/api/v2/product/2');
            server.info(res);
            expect(res).to.eql({
                status: 'success',
                result: {
                    id: 2,
                    name: 'product2',
                },
            });

            res = await client.get('/test-app/api/v2/store');
            server.info(res);
            expect(res).to.eql([
                {
                    id: 1,
                    name: 'Store 1',
                    address: 'Address 1',
                },
                {
                    id: 2,
                    name: 'Store 2',
                    address: 'Address 2',
                },
            ]);

            res = await client.get('/test-app/api/v2/store/2');
            server.info(res);
            expect(res).to.eql({
                id: 2,
                name: 'Store 2',
                address: 'Address 2',
            });

            res = await client.get('/test-app/api/v2/store/2/pet');
            server.info(res);
            expect(res).to.eql([
                {
                    id: 1,
                    name: 'Pet 1',
                    storeId: 2,
                },
                {
                    id: 2,
                    name: 'Pet 2',
                    storeId: 2,
                },
            ]);

            res = await client.get('/test-app/api/v2/store/1/pet/1');
            server.info(res);
            expect(res).to.eql({
                id: 1,
                name: 'Pet 1',
                storeId: 1,
            });
        });
    });
});
