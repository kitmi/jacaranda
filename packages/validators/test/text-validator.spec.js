import text from '../src/validators/text';
import SYS, { Types } from '../src/allSync';
import zh from '@kitmi/jsonv/locale/zh';

SYS.jsvConfig.loadMessages('zh-CN', zh);

describe.only('text validator', function () {
    it('isURL', async function () {
        text.url('https://www.example.com').should.be.eql([true]);
        text.url('/anb/fddef', { require_host: false, allow_protocol_relative_urls: true }).should.be.eql([true]);
        text.url('anb/fddef', { require_host: false, allow_protocol_relative_urls: true })[0].should.be.false;
    });
});