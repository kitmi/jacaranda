import grepLines from '../src/grepLines';

describe('grepLines', () => {
    const textData = 'line 1\nline 2\nline 3\nline 4\nline 5\n';

    it('should only keep lines that match any of the patterns', () => {
        const patterns = [/2/, /4/];
        const result = grepLines(textData, patterns);
        result.should.equal('line 2\nline 4');
    });
});
