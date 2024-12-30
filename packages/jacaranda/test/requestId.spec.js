describe('server with requestId', function () {   
    it('action from registry', async function () {
        await jacat.withClient_('server2', async (client, server) => {
            // from simple of ./test/controllers/actions/index.js
            const res = await client.get('/simple/request-id');
             res.split(':').length.should.be.eql(3);
        });
    });  
});
