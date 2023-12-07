import bin2Hex from '../src/bin2Hex';

describe('bin2Hex', () => {
    it('bvt', () => {
        const bin = Buffer.from('abc');
        const hex = bin2Hex(bin);
        hex.should.be.eql('0x616263');
    });
});
