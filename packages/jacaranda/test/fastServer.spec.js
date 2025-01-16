describe('fast server', function () {   
    it('action from registry', async function () {
        await jacat.withClient_('server3', async (client, server) => {
            // from simple of ./test/controllers/actions/index.js
            const res = await client.get('/api/hello');
            res.should.be.eql({
                hello: 'Jacaranda',
            });
        });
    });  
});
