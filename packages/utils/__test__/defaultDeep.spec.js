import defaultDeep from '../src/defaultDeep';

describe('defaultDeep', () => {
    it('should return the first non-null value for a key', () => {
        const obj = { a: null, b: undefined, c: 1 };
        const source1 = { a: 2, b: 3 };
        const source2 = { b: 4 };
        const result = defaultDeep(obj, source1, source2);
        result.should.eql({ a: 2, b: 3, c: 1 });
    });

    it('should return the orginal object for no sources', () => {
        const obj = { a: 1 };
        const result = defaultDeep(obj);
        result.should.eql(obj);
    });

    it('should return a new object', () => {
        const obj = { a: 1 };
        const source1 = { b: 2 };
        const result = defaultDeep(obj, source1);
        result.should.not.equal(obj);
        result.should.not.equal({ a: 1, b: 2 });
    });
});
