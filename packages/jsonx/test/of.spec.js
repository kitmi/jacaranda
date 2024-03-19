import Jxs from '../src';

describe('Jxs:of', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $valueOf: 'id' });
        //console.log(transformed)
        transformed.should.be.eql(1);
    });

    it('array', function () {
        let array = [10, 20, 30, 40];

        let transformed = Jxs.evaluate(array, { $valueOf: '1' });
        //console.log(transformed)
        transformed.should.be.eql(20);
    });

    it('find index', function () {
        let array = [10, 20, 30, 40];

        let transformed = Jxs.evaluate(array, { $findIndex: { $eq: 20 } });
        //console.log(transformed)
        transformed.should.be.eql(1);
    });

    it('find key', function () {
        let obj = {
            key1: 10,
            key2: 20,
            key3: 30,
        };

        let transformed = Jxs.evaluate(obj, { $findKey: { $eq: 20 } });
        //console.log(transformed)
        transformed.should.be.eql('key2');
    });

    it('find index from index', function () {
        let array = [10, 20, 30, 20];

        let transformed = Jxs.evaluate(array, { $findIndex: [{ $eq: 20 }, 2 ] });
        //console.log(transformed)
        transformed.should.be.eql(3);
    });
});
