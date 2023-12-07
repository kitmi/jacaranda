import { move, swap, insert, copyArrayLike, uniqPush } from '../src/arrayImmutable';

describe('arrayImmutable', () => {
    describe('move', () => {
        it('should move an element from one index to another', () => {
            const array = [1, 2, 3, 4, 5];
            const result = move(array, 1, 3);
            result.should.eql([1, 3, 4, 2, 5]);
        });

        it('should return a new array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = move(array, 1, 3);
            result.should.not.equal(array);
        });
    });

    describe('swap', () => {
        it('should swap two elements in an array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = swap(array, 1, 3);
            result.should.eql([1, 4, 3, 2, 5]);
        });

        it('should return a new array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = swap(array, 1, 3);
            result.should.not.equal(array);
        });
    });

    describe('insert', () => {
        it('should insert an element into an array at a specific index', () => {
            const array = [1, 2, 3, 4, 5];
            const result = insert(array, 2, 6);
            result.should.eql([1, 2, 6, 3, 4, 5]);
        });

        it('should return a new array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = insert(array, 2, 6);
            result.should.not.equal(array);
        });
    });

    describe('copyArrayLike', () => {
        it('should return a new array with the same elements', () => {
            const array = [1, 2, 3, 4, 5];
            const result = copyArrayLike(array);
            result.should.eql(array);
        });

        it('should return an empty array for null input', () => {
            const result = copyArrayLike(null);
            result.should.eql([]);
        });

        it('should return a new array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = copyArrayLike(array);
            result.should.not.equal(array);
        });
    });

    describe('uniqPush', () => {
        it("should push a value to an array if it's not already in the array", () => {
            const array = [1, 2, 3, 4, 5];
            const result = uniqPush(array, 6);
            result.should.eql([1, 2, 3, 4, 5, 6]);
        });

        it("should not push a value to an array if it's already in the array", () => {
            const array = [1, 2, 3, 4, 5];
            const result = uniqPush(array, 3);
            result.should.eql([1, 2, 3, 4, 5]);
        });

        it('should return a new array', () => {
            const array = [1, 2, 3, 4, 5];
            const result = uniqPush(array, 6);
            result.should.not.equal(array);
        });
    });
});
