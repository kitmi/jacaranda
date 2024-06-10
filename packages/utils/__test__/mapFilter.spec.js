import mapFilter from '../src/mapFilter';

describe('mapFilter', () => {
    it('should filter and map an array of numbers', () => {
        const collection = [1, 2, 3, 4, 5];
        const filterPredicate = (value) => value > 2;
        const mapper = (value) => value * 2;

        const result = mapFilter(collection, filterPredicate, mapper);

        expect(result).to.deep.equal([6, 8, 10]);
    });

    it('should filter and map an array of strings', () => {
        const collection = ['apple', 'banana', 'cherry'];
        const filterPredicate = (value) => value.includes('a');
        const mapper = (value) => value.toUpperCase();

        const result = mapFilter(collection, filterPredicate, mapper);

        expect(result).to.deep.equal(['APPLE', 'BANANA']);
    });

    it('should filter and map an object', () => {
        const collection = { a: 1, b: 2, c: 3, d: 4 };
        const filterPredicate = (value) => value % 2 === 0;
        const mapper = (value) => value + 1;

        const result = mapFilter(collection, filterPredicate, mapper);

        expect(result).to.deep.equal({ b: 3, d: 5 });
    });

    it('should return an empty array when no elements match the predicate', () => {
        const collection = [1, 2, 3];
        const filterPredicate = (value) => value > 5;
        const mapper = (value) => value * 2;

        const result = mapFilter(collection, filterPredicate, mapper);

        expect(result).to.deep.equal([]);
    });

    it('should return an empty object when no elements match the predicate', () => {
        const collection = { a: 1, b: 2, c: 3 };
        const filterPredicate = (value) => value > 5;
        const mapper = (value) => value * 2;

        const result = mapFilter(collection, filterPredicate, mapper);

        expect(result).to.deep.equal({});
    });
});
