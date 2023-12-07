import baseName from '../src/baseName';

describe('baseName', () => {
    it('should return the base name of a file path', () => {
        const result = baseName('/path/to/file.txt');
        result.should.equal('file');
    });

    it('should return the full path if includePath is true', () => {
        const result = baseName('/path/to/file.txt', true);
        result.should.equal('/path/to/file');
    });

    it('should handle file names without extensions', () => {
        const result = baseName('/path/to/file');
        result.should.equal('file');
    });

    it('should handle file names with multiple dots', () => {
        const result = baseName('/path/to/file.name.txt');
        result.should.equal('file.name');
    });

    it('should handle backslashes in file paths', () => {
        const result = baseName('\\path\\to\\file.txt');
        result.should.equal('file');
    });

    it('should handle mixed slashes in file paths', () => {
        const result = baseName('/path\\to/file.txt');
        result.should.equal('file');
    });
});
