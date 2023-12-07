import countOfChar from '../src/countOfChar';

describe('countOfChar', () => {
    it('should return the number of occurrences of a character in a string', () => {
        const result = countOfChar('hello world', 'l');
        result.should.equal(3);
    });

    it('should return 0 if the character is not found', () => {
        const result = countOfChar('hello world', 'x');
        result.should.equal(0);
    });

    it('should return 0 if the string is empty', () => {
        const result = countOfChar('', 'x');
        result.should.equal(0);
    });
});