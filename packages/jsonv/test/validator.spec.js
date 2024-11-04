import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe('jsv:validator', function () {
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

        Jsv.match(obj, {
            key1: 2000,
            key2: 'ok',
            key3: {
                key1: 20,
                key2: 'ok',
            },
            key4: null,
            key5: false,
            key6: true,
        }).should.be.eql([true]);

        let result = Jsv.match(obj, {
            key1: 2001,
        });
        result[0].should.not.be.ok;
        result[1].should.be.match(/ must be 2001/);

        result = Jsv.match(obj, {
            key2: 'ng',
        });
        result[0].should.not.be.ok;
        result[1].should.be.match(/ must be "ng"/);
    });

    it('equal2', function () {
        let obj = {
            key1: [1, 2, 3],
            key2: [1],
        };

        Jsv.match(obj, {
            key1: { $eq: [1, 2, 3] },
            key2: { $eq: [1] },
        })[0].should.be.ok;

        const result = Jsv.match(obj, {
            key1: [1, 2],
            key2: [1, 3],
        });
        console.log(result);

        result[0].should.be.not.ok;

        Jsv.match(obj, {
            key1: [1, 2],
            key2: [1],
        })[0].should.be.not.ok;
    });

    it('required', function () {
        let obj = {
            a: 10,
            b: 20
        };

        Jsv.match(obj, {
            a: { $required: true },
            c: { $required: false },
        }).should.be.eql([true]);

        Jsv.match(obj, {
            c: { $required: true },
        }).should.be.eql([false, '"c" is required.']);
    });

    it('not', function () {
        let obj = {
            a: 10,
            b: 20
        };

        Jsv.match(obj, {
            a: { $not: { $eq: 20 } }
        }).should.be.eql([true]);

        Jsv.match(obj, {
            a: { $eq: 10 }
        }).should.be.eql([true]);

        const result = Jsv.match(obj, {
            a: { $eq: 20 }
        });

        result[0].should.be.not.ok;
        result[1].should.be.match(/ must be 20/);
    });

    it('size', function () {
        let array =[10, 20, 30];

        Jsv.match(array, {
            $size: 3
        }).should.be.eql([true]);

        Jsv.match(array, {
            $size: 2
        }).should.be.eql([false, 'The value must be 2.']);
    });

    it('mixed', function () {
        var c = { a: { b: 10 }, c: 20 };
        let obj = {
            key1: 2000,
            key11: 2000,
            key12: 2000,
            key13: 2000,

            key2: 'ok',
            key21: 'ok',
            key22: 'ok',
            key23: 'ok',
            key24: 'ok',
            key25: 1,

            key3: {
                key1: 20,
                key2: 'ok',
            },
            key4: null,
            key5: false,
            key6: true,
            key8: c,
        };

        Jsv.match(obj, {
            key1: { $gt: 1000 },
            key11: { $gte: 2000 },
            key12: { $lt: 3000 },
            key13: { $lte: 2000 },

            key2: { $eq: 'ok' },
            key21: { $neq: 'ng' },

            key22: { $in: ['ok', 'ng'] },
            key23: { $nin: ['ng1', 'ng2'] },            

            key4: { $exists: false },
        }).should.be.eql([true]);

        Jsv.match(obj, {
            key3: { $hasKey: 'key1' },
        }).should.be.eql([true]);

        Jsv.match(obj, {
            key8: { $hasKeys: [ 'a', 'c' ] },
        }).should.be.eql([true]);
    });

    it('Jsv', function () {
        //var c = {a:{b:10}};
        let obj = {
            key1: 2000,
            key11: 2000,
            key12: 2000,
            key13: 2000,

            key2: 'ok',
            key21: 'ok',
            key22: 'ok',
            key23: 'ok',

            key3: {
                key1: 20,
                key2: 'ok',
            },
            key4: null,
            key5: false,
            key6: true,
            key7: [1, 2, 3],
            //key8: c,
        };

        const Jsvo = new Jsv(obj);
        Jsvo.match({
            key1: { $gt: 1000 },
            key11: { $gte: 2000 },
            key12: { $lt: 3000 },
            key13: { $lte: 2000 },
        })
            .match({
                key2: { $eq: 'ok' },
                key21: { $neq: 'ng' },

                key22: { $in: ['ok', 'ng'] },
                key23: { $nin: ['ng1', 'ng2'] },

                key4: { $exists: false },
                key2: { $isType: 'string' },
                key7: { $isType: 'array' },
                key1: { $isType: 'integer' },
            })
            .match({
                key3: {
                    key1: 20,
                    key2: {
                        $neq: 'ng',
                    },
                },
            });

        Jsvo.match({
            key1: { $isType: 'integer' },
        });

        should.throws(() => {
            Jsvo.match({
                key1: { $isType: 'string' },
            });
        }, 'The value of "key1" must be a(n) "string"');

        should.throws(() => {
            Jsvo.match({
                key4: { $exists: true },
            });
        }, '"key4" must not be null.');

        should.throws(() => {
            Jsvo.match({
                key1: { $in: 3000 },
            });
        }, 'The right operand of a "in" operator must be an array.');

        should.throws(() => {
            Jsvo.match({
                key1: { $nin: 3000 },
            });
        }, 'The right operand of a "notIn" operator must be an array.');

        should.throws(() => {
            Jsvo.match({
                key1: { $gt: 3000 },
            });
        }, /"key1" must be greater than 3000/);

        should.throws(() => {
            Jsvo.match({
                key1: { $lt: 1000 },
            });
        }, /"key1" must be less than 1000/);

        should.throws(() => {
            Jsvo.match({
                key1: { $in: [100, 200] },
            });
        }, '"key1" must be one of [100,200].');

        should.throws(() => {
            Jsvo.match({
                key1: { $nin: [1000, 2000] },
            });
        }, '"key1" must not be any one of [1000,2000].');

        should.throws(() => {
            Jsvo.match({
                key99: { $exist: true },
            });
        }, '"key99" must not be null.');

        should.throws(() => {
            Jsvo.match({
                key1: { $exist: false },
            });
        }, '"key1" must be null.');

        should.throws(() => {
            Jsvo.match({
                key1: { $isType: 'string' },
            });
        }, 'The value of "key1" must be a(n) "string".');

        should.throws(() => {
            Jsvo.match({
                key3: { key2: 'ng' },
            });
        }, '"key3.key2" must be "ng".');
    });

    it('any', function () {
        let obj = {
            key1: 2000,
            key11: 2000,
            key12: 2000,
            key13: 2000,
        };

        let Jsvo = new Jsv(obj);

        Jsvo.match({
            $any: [{ key1: 3000 }, { key11: 2000 }],
        });

        should.throws(() => {
            Jsvo.match({
                $any: [{ key1: 3000 }, { key11: 3000 }],
            });
        }, /The value does not match any of given criterias/);

        should.throws(() => {
            Jsvo.match({
                $any: { key1: 3000 },
            });
        }, 'The right operand of a "anyOf" operator must be an array.');
    });

    it('all match', function () {
        let objs = [1000, 2320, 2333, 4567];

        Jsv.match(objs, {
            '|>$all': { $gte: 1000 }
        }).should.be.eql([true]);

        Jsv.match(objs, {
            '|>$all': { $gt: 2000 }
        }).should.be.eql([false, [
            'One of the element of the value does not match the requirement(s).',
            'The value must be greater than 2000.'
        ]]);
    });
    it('should', function () {
        let obj = {
            key1: 123,
            key2: 456,
        };

        Jsv.match(obj, {
            key1: { $should: { $eq: 123 } },
            key2: { $should: { $eq: 456 } },
        }).should.be.eql([true]);
    });
    it('any match', function () {
        let array = [1, 2, 3, 4, -1];

        let matched = Jsv.match(array, {
            '|*$match': { $lt: 0 },
        });
        matched.should.be.eql([true]);

        let matched3 = Jsv.match(array, {
            '|*$match': { $gt: 10 },
        });

        matched3.should.be.eql([false, "None of the element of the value matches the requirement(s)."]);

    });
});
