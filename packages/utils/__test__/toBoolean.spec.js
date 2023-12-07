import toBoolean from '../src/toBoolean';

describe('toBoolean', () => {
    it('should return true for true boolean input', () => {
        toBoolean(true).should.be.true;
    });

    it('should return false for false boolean input', () => {
        toBoolean(false).should.be.false;
    });

    it("should return true for '1' string input", () => {
        toBoolean('1').should.be.true;
    });

    it("should return true for 'true' string input", () => {
        toBoolean('true').should.be.true;
    });

    it("should return true for 'TRUE' string input", () => {
        toBoolean('TRUE').should.be.true;
    });

    it("should return false for '0' string input", () => {
        toBoolean('0').should.be.false;
    });

    it("should return false for 'false' string input", () => {
        toBoolean('false').should.be.false;
    });

    it("should return false for 'FALSE' string input", () => {
        toBoolean('FALSE').should.be.false;
    });

    it('should return false for non-boolean and non-string input', () => {
        toBoolean(123).should.be.false;
    });
});
