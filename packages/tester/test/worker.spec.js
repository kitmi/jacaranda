describe('worker', function () {
    it('basic', async function () {
        await jacat.startWorker_('tester', async (app) => {
            const basic = app.getService('basic');
            expect(basic).to.exist;
            expect(basic(200)).to.equal(300);
        });
    });
});
