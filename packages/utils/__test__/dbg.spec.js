import dbgLib from './dbgLib';

describe('dbg', function () {
    it('getCallerFile', async function () {
        const file = dbgLib();

        file.should.be.exactly(__filename);
    });
});
