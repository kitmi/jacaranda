describe('smoke', function () {
    it('/bvt', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            const res = await client.get('/');
            server.info(res);
            expect(res).to.equal('Hello Jacaranda!');
        });
    });
});
