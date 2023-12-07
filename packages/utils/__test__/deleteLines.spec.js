import deleteLines from '../src/deleteLines';

describe('deleteLines', () => {
    const textData = 'line 1\nline 2\nline 3\nline 4\nline 5\n';

    it('should delete lines that match any of the patterns', () => {
        const patterns = [/line 2/, /line 4/];
        const result = deleteLines(textData, patterns);
        result.should.equal('line 1\nline 3\nline 5\n');
    });

    it('should handle patterns with special characters', () => {
        const patterns = [/^line 1$/, /line 3/];
        const result = deleteLines(textData, patterns);
        result.should.equal('line 2\nline 4\nline 5\n');
    });

    it('should handle patterns with multiple matches on the same line', () => {
        const patterns = [/line 2/, /line 5/];
        const result = deleteLines(textData, patterns);
        result.should.equal('line 1\nline 3\nline 4\n');
    });

    it('should handle patterns that match the entire line', () => {
        const patterns = [/line 1/, /line 5/];
        const result = deleteLines(textData, patterns);
        result.should.equal('line 2\nline 3\nline 4\n');
    });

    it('should handle custom line delimiters', () => {
        const patterns = [/line 2/, /line 4/];
        const result = deleteLines(textData.replace(/\n/g, '\r\n'), patterns, '\r\n');
        result.should.equal('line 1\r\nline 3\r\nline 5\r\n');
    });

    it('should return an empty string if all lines are deleted', () => {
        const patterns = [/line \d+/];
        const result = deleteLines(textData, patterns);
        result.should.equal('');
    });

    it('should return the original text if no lines match the patterns', () => {
        const patterns = [/not found/];
        const result = deleteLines(textData, patterns);
        result.should.equal(textData);
    });
});
