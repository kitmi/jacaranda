describe('test1', function () {
    it('should pass1', function () {
        expect(true).to.be.true;
    });

    it('should pass2', function () {
        expect(true).to.be.true;
        jacat.attach('test2 result', {
            key: 'tesst',
            key2: 'tesst',
            key3: 'tesst',
        });
    });

    it('should pass async', async function () {
        await jacat.step_('step1', async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        expect(true).to.be.true;
    });
});
