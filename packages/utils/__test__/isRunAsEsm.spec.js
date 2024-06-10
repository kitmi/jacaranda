import isRunAsEsm from '../src/isRunAsEsm';

describe('isRunAsEsm', function () {
    it('no', function () {
        const isEsm = isRunAsEsm();
        isEsm.should.not.be.ok;
    });
});
