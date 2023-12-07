import { uniqPush } from '../src/arrayImmutable';

describe('array utils', () => {
    const array = [10, 20, 30, 40];

    it('uniqPush', async () => {
        const a2 = uniqPush(array, 20);
        array.should.be.eql([10, 20, 30, 40]);
        a2.should.be.eql(array);

        const a3 = uniqPush(array, 50);
        array.should.be.eql([10, 20, 30, 40]);
        a3.should.be.eql([10, 20, 30, 40, 50]);
    });
});
