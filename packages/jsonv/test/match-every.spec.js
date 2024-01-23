import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe('jsv:match-every', function () {
    it('match array', function () {
        const obj = {
            key1: [1, 2, 3],
            key2: [1],
        };

        const result = Jsv.match(obj, [
            { $hasKeys: ['key1', 'key2'] },
            { key2: [{ $size: 1 }, { '|>$match': { $typeOf: 'integer' } }] },
        ]);

        result[0].should.be.ok;
    });

    it('match array - negative', function () {
        const obj = {
            key1: [1, 2, 3],
            key2: ['jfei'],
        };

        const result = Jsv.match(obj, { key2: [{ $size: 1 }, { '|>$match': { $typeOf: 'integer' } }] });

        result[0].should.not.be.ok;
        result[1].should.be.eql([
            'One of the element of "key2" does not match the requirement(s).',
            'The value of "key2" must be a(n) "integer".'
          ]);
    });
});
