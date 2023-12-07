import changeExtName from '../src/changeExtName';

describe('changeExtName', () => {
    it('case 1', () => {
        const result = changeExtName('/path/to/file.txt', 'doc');
        result.should.equal('file.doc');
    });

    it('should return the full path if includePath is true', () => {
        const result = changeExtName('/path/to/file.txt', 'doc', true);
        result.should.equal('/path/to/file.doc');
    });
});
