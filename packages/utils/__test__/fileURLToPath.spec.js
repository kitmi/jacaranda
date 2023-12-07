import fileURLToPath from '../src/fileURLToPath';
import url from 'node:url';

describe('fileURLToPath', () => {
    it('win32 case 1', () => {
        process.env.TEST_PLATFORM = 'win32';
        fileURLToPath('file:///C:/path/').should.be.eql('C:\\path\\');
    });

    it('win32 case 2', () => {
        process.env.TEST_PLATFORM = 'win32';
        fileURLToPath('file://nas/foo.txt').should.be.eql('\\\\nas\\foo.txt');
    });

    it('win32 hostname', () => {
        process.env.TEST_PLATFORM = 'win32';
        fileURLToPath('file://localhost/c:/WINDOWS/clock.avi').should.be.eql('c:\\WINDOWS\\clock.avi');
    });

    it('non-win32 case 1', () => {
        delete process.env.TEST_PLATFORM;
        fileURLToPath('file:///你好.txt').should.be.eql('/你好.txt');
    });

    it('non-win32 case 2', () => {
        delete process.env.TEST_PLATFORM;
        fileURLToPath('file:///hello world').should.be.eql('/hello world');
    });

    it('host name', () => {
        delete process.env.TEST_PLATFORM;
        const fileUrl = 'file://localhost/etc/fstab';
        fileURLToPath(fileUrl).should.be.eql(url.fileURLToPath(fileUrl));
        
    });
});
