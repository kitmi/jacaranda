import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe('jsv:issue-verify', function () { 
    it('match by context', function () {       
        const result = Jsv.match(3, '$$.maxIndex', null, {
            $$: {
                maxIndex: 3,
                index: 3
            }
        });

        result[0].should.be.ok;
    });
});