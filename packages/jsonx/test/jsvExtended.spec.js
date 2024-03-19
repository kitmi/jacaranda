import JSX from '../src';
import enUS from '../src/locale/en-US';

JSX.config.loadMessages('en-US', enUS).setLocale('en-US');
const JSV = JSX.JSV;

describe('jsv:ex-expr', function () {
    it('case 1', function () {
        JSV.match(
            {
                key1: 10,
                key2: {
                    key3: 5,
                },
            },
            {
                key1: {
                    $lt: {
                        $expr: '$parent.key2.key3',
                    },
                },
            }
        )[0].should.be.eql(false);

        JSV.match(
            {
                key1: 10,
                key2: {
                    key3: 5,
                },
            },
            {
                key1: {
                    $lt: {
                        $expr: [ '$parent.key2.key3', { $add: 10 } ],
                    },
                },
            }
        )[0].should.be.eql(true);
    });
});
