import { trimLeft, trimRight } from '../src/string';

describe('trim', () => {
    it('trimLeft', () => {
        trimLeft('  abc  ').should.be.eql('abc  ');
        trimLeft('xxxabc', 'x').should.be.eql('abc');
        trimLeft('   abc   ', 'x').should.be.eql('   abc   ');
    });

    it('trimRight', () => {
        trimRight('  abc  ').should.be.eql('  abc');
        trimRight('abcxxx', 'x').should.be.eql('abc');
        trimRight('   abc   ', 'x').should.be.eql('   abc   ');
    });
});
