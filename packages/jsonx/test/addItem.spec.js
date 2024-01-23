import Jsx from '../src';

describe('jsx:addItem', function () {
    it('object', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { '$addItem': ["key", 100] });
        //console.log(transformed)
        transformed.should.be.eql(
            {
                ...obj,
                key: 100
            }
        );
    });

    it('object with expr key', function () {
        let obj = {
            key1: 1,
            key2: 2,
            key3: 'key3AsKey'
        };

        let transformed = Jsx.evaluate(obj, { '$addItem': [{ $expr: '$this.key3' }, 100] });
        //console.log(transformed)
        transformed.should.be.eql(
            {
                ...obj,
                key3AsKey: 100
            }
        );
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, { '$addItem': 4 });
        //console.log(transformed)
        transformed.should.be.eql(
            [1, 2, 3, 4]
        );
    });

    it('array 2', function () {
        let array = [1, 2, 3];
        const result = Jsx.evaluate(array, { '$addItem': { $expr: '$size' } });
        result.should.be.eql([1, 2, 3, 3]);
    });
});
