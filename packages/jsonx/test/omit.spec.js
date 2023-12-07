import Jxs from '../src';

describe('Jxs:omit', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $omit: 'id' });
        //console.log(transformed)
        transformed.should.be.eql({
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });

    it('array', function () {
        let array = [
            {
                'id': 1,
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
        ];

        let transformed = Jxs.evaluate(array, { '|>$omit': 'id' });
        //console.log(transformed)
        transformed.should.be.eql([
            {
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
        ]);
    });

    it('omitBy', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $omit: { $endsWith: 'cy' } });
        //console.log(transformed)
        transformed.should.be.eql({
            'id': 1,
            'user': 100,
            ':user': { email: 'email1', other: 'any' },
        });
    });
});
