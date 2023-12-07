import isInteger, { RANGE_POSITIVE, RANGE_NEGATIVE, RANGE_NON_ZERO, RANGE_INDEX } from '../src/isInteger';

describe('isInteger', function () {
    it('number', function () {
        isInteger(10).should.be.ok;
        isInteger(0).should.be.ok;
        isInteger(-100).should.be.ok;
        isInteger(+100).should.be.ok;
        isInteger(10.4).should.not.be.ok;
    });

    it('string', function () {
        isInteger('10').should.be.ok;
        isInteger('0').should.be.ok;
        isInteger('-100').should.be.ok;
        isInteger('+100').should.be.ok;
        isInteger('10.4').should.not.be.ok;
    });

    it('string 2', function () {
        isInteger('10 abc').should.not.be.ok;
        isInteger('- 120').should.not.be.ok;
    });

    it('string with range', function () {
        isInteger('10', { range: RANGE_POSITIVE }).should.be.ok;
        isInteger('10', { range: RANGE_NEGATIVE }).should.not.be.ok;
        isInteger('10', { range: RANGE_NON_ZERO }).should.be.ok;
        isInteger('10', { range: RANGE_INDEX }).should.be.ok;
        isInteger('+10', { range: RANGE_INDEX }).should.not.be.ok;

        isInteger('-10', { range: RANGE_POSITIVE }).should.not.be.ok;
        isInteger('-10', { range: RANGE_NEGATIVE }).should.be.ok;
        isInteger('-10', { range: RANGE_NON_ZERO }).should.be.ok;
        isInteger('-10', { range: RANGE_INDEX }).should.not.be.ok;

        isInteger('0', { range: RANGE_POSITIVE }).should.not.be.ok;
        isInteger('0', { range: RANGE_NEGATIVE }).should.not.be.ok;
        isInteger('0', { range: RANGE_NON_ZERO }).should.not.be.ok;
        isInteger('0', { range: RANGE_INDEX }).should.be.ok;
    });
});
