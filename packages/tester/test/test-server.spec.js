describe('test-server', function () {
    it('/test', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            const res = await client.get('/test');
            server.info(res);
            expect(res).to.equal('Hello World!');
        });
    });

    it('/test/protected ng', async function () {
        await jacat.withClient_('server1', async (client, server) => {            
            jacat.throw_(() => client.get('/test/protected'), 'Unauthenticated');
        });
    });

    it('/test/protected ok', async function () {
        await jacat.withClient_('server1', 'client1', async (client, server) => {
            const res = await client.get('/test/protected');
            expect(res).to.deep.equal({ status: 'ok' });
        });
    });
});
