describe('server 2', function () {
    it('action from registry', async function () {
        await jacat.withClient_('server2', async (client, server) => {
            // from simple of ./test/controllers/actions/index.js
            const res = await client.get('/simple');
            res.should.be.eql('Hello, Jacaranda! 20');
        });
    });  
});
