describe('fixtures', function () {
    jacat.loadFixtures(async function (data) {
        await jacat.startWorker_('tester', async (app) => {
            const basic = app.getService('basic');
            expect(basic).to.exist;
            expect(basic(data.input)).to.equal(data.expect);
        });
    });
});
