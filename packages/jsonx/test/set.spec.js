import Jxs from '../src';

describe('Jxs:setValue', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jxs.evaluate(array, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('num', function () {
        let num = 1;

        let transformed = Jxs.evaluate(num, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { 
            $assign: {
                'id': { $set: 2  }
            }            
        });
        //console.log(typeof transformed)
        transformed.should.be.eql({
            'id': 2,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });
});
