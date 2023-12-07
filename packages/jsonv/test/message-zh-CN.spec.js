import Jsv from '../src/bundle';

describe('jsv:message', function () {
    before(function () {
        Jsv.config.setLocale('zh-CN');
    });

    after(function () {
        Jsv.config.setLocale('en-US');
    });

    it('equal', function () {
        let obj = {
            key1: 2000,
            key2: 'ok',
            key3: {
                key1: 20,
                key2: 'ok',
            },
            key4: null,
            key5: false,
            key6: true,
        };

        
        let result = Jsv.match(obj, {
            key1: 2001,
        });

        result[0].should.not.be.ok;
        result[1].match('"key1" 的值必须为 2001。' ).should.be.ok;

        result = Jsv.match(obj, {
            key2: 'ng',
        });
        result[0].should.not.be.ok;
        result[1].match('"key2" 的值必须为 "ng"。').should.be.ok;

        Jsv.config.setLocale('en-US');
    });
});
