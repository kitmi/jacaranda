describe('features', function () {
    it('env', async function () {
        await jacat.startWorker_('test-env', async (app) => {
            expect(app.settings.test).to.equal('something');
        });
    });
});