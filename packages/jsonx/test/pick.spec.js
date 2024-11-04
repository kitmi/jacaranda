import Jxs from '../src';

describe('Jxs:processor', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $pick: 'id' });
        //console.log(transformed)
        transformed.should.be.eql({ id: 1 });
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

        let transformed = Jxs.evaluate(array, { '|>$pick': 'id' });
        //console.log(transformed)
        transformed.should.be.eql([{ id: 1 }]);
    });

    it('pickBy', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $pick: { by: { $endsWith: 'cy' } } });
        //console.log(transformed)
        transformed.should.be.eql({
            'agency': 1,
            ':agency': { name: 'agency1', other: 'any' },
        });
    });

    it('pick with empty entry', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $pick: { keys: [ 'user', 'password' ], reserveEmptyEntry: true } });
        //console.log(transformed)
        transformed.should.be.eql({
            'user': 100,
            'password': null,
        });
    });

    it('pick keys and by', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $pick: { keys: [ 'user', ':agency' ], by: { $startsWith: ':' }} });
        //console.log(transformed)
        transformed.should.be.eql({
            ':agency': { name: 'agency1', other: 'any' },
        });
    });

});
