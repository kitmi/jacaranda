import insertBetween from '../src/insertBetween';

describe('unit:insertBetween', function () {
    it('Insert a separator as element into an array.', async function () {
        const arr1 = [1, 2, 3, 4];
        const arr2 = [{ 1: 1 }, { 2: 2 }, 3, 4];
        const arr3 = [1, 2, 3];
        const arr4 = [1];
        const arr5 = [];

        const after_insert1 = insertBetween(arr1, 1);
        const after_insert2 = insertBetween(arr2, 1);
        const after_insert3 = insertBetween(arr3, { a: 1 });
        const after_insert4 = insertBetween(arr4, 1);
        const after_insert5 = insertBetween(arr5, 1);

        after_insert1.should.be.eql([[1, 1], [2, 1], [3, 1], [4]]);
        after_insert2.should.be.eql([[{ 1: 1 }, 1], [{ 2: 2 }, 1], [3, 1], [4]]);
        after_insert3.should.be.eql([[1, { a: 1 }], [2, { a: 1 }], [3]]);
        after_insert4.should.be.eql([[1]]);
        after_insert5.should.be.eql([]);
    });
});
