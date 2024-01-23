import Jxs from '../src';

describe('Jxs:type', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, '$type');
        //console.log(transformed)
        transformed.should.be.eql('object');
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jxs.evaluate(array, '$type');
        //console.log(transformed)
        transformed.should.be.eql('array');
    });

    it('num', function () {
        let num = 1.5;

        let transformed = Jxs.evaluate(num, '$type');
        //console.log(transformed)
        transformed.should.be.eql('number');
    });

    it('integer', function () {
        let num = 5;

        let transformed = Jxs.evaluate(num, '$type');
        //console.log(transformed)
        transformed.should.be.eql('integer');
    });

    it('boolean', function () {
        let bool = false;

        let transformed = Jxs.evaluate(bool, '$type');
        //console.log(transformed)
        transformed.should.be.eql('boolean');
    });

    it('string', function () {
        let str = 'string';

        let transformed = Jxs.evaluate(str, '$type');
        //console.log(transformed)
        transformed.should.be.eql('string');
    });

    it('bigint', function () {
        let bigint = 100n;

        let transformed = Jxs.evaluate(bigint, '$type');
        //console.log(transformed)
        transformed.should.be.eql('bigint');
    });

    it('null', function () {
        let nullValue = null;

        let transformed = Jxs.evaluate(nullValue, '$type');
        transformed.should.be.eql('any');
    });
});
