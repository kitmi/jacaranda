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
});
