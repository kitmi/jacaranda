import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe('jsv:expr', function () {
    it('case 1', function () {
        Jsv.match(
            {
                key1: 10,
                key2: {
                    key3: 20,
                },
            },
            {
                key1: {
                    $lt: {
                        $expr: '$parent.key2.key3',
                    },
                },
            }
        ).should.be.eql([true]);
    });

    it('case 2', function () {
        Jsv.match(
            {
                key1: 10,
                key2: {
                    key3: 20,
                },
            },
            {
                key1: {
                    $gt: {
                        $expr: '$parent.key2.key3',
                    },
                },
            }
        ).should.be.eql([false, '"key1" must be greater than [$parent.key2.key3].']);
    });

    it('case 3', function () {
        Jsv.match(
            {
                key1: 10,
                key2: {
                    key3: 20,
                    key4: 5,
                },
                key5: 1,
            },
            {
                key1: {
                    $gt: {
                        $expr: [
                            '$parent.key2',
                            {
                                $valueAt: { $expr: '$parent.key5' },
                            },
                        ], // key2.key4
                    },
                },
            }
        ).should.be.eql([true]);
    });
});
