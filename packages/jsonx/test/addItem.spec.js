import Jxs from '../src';

describe('jxs:addItem', function () {
    it('object', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { '$addItem': ["key", { $value: 100 }] });
        //console.log(transformed)
        transformed.should.be.eql(
            {
                ...obj,
                key: 100
            }
        );
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jxs.evaluate(array, { '$addItem': { $value: 4 } });
        //console.log(transformed)
        transformed.should.be.eql(
            [1, 2, 3, 4]
        );
    });

    it('array 2', function () {
        let array = [1, 2, 3];

        should.throws(() => Jxs.evaluate(array, { '$addItem': 4 }), 'Number value cannot be used as a transformer expression.');
    });
});
