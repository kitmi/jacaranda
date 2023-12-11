describe('test-server', function () {
    it('/test', async function () {
        await gxt.withHttpClient_('server1', async (client) => {
            const res = await client.get('/test');
            expect(res).to.equal('Hello World!');
        });
    });
});
