import { ntob64, b64ton } from '../src/n2b64';

describe('ntob64', () => {
    it('encode 0', () => {
        const num = 0;
        const base64 = ntob64(num);
        base64.should.be.eql('-');
    });

    it('encode 1', () => {
        const num = 1;
        const base64 = ntob64(num);
        base64.should.be.eql('0');
    });

    it('encode -1', () => {
        const num = -1;
        const base64 = ntob64(num);
        base64.should.be.eql('-0');
    });

    it('encode 64', () => {
        const num = 64;
        const base64 = ntob64(num);
        base64.should.be.eql('0-');
    });

    it('encode 100', () => {
        const num = 100;
        const base64 = ntob64(num);
        base64.should.be.eql('0Z');
    });

    it('encode -100', () => {
        const num = -100;
        const base64 = ntob64(num);
        base64.should.be.eql('-0Z');
    });

    it('decode -0Z', () => {
        const str = '-0Z';
        const num = b64ton(str);
        num.should.be.eql(-100);
    });

    it('decode 0Z', () => {
        const str = '0Z';
        const num = b64ton(str);
        num.should.be.eql(100);
    });
});
