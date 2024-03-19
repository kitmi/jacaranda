import Jsx from '../src';

describe('Jsx:setValue', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('set with expr', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, { $set: { $value: 100 } });
        //console.log(typeof transformed)
        transformed.should.be.eql({ $value: 100 });
    });

    it('num', function () {
        let num = 1;

        let transformed = Jsx.evaluate(num, { $set: 'new' });
        //console.log(typeof transformed)
        transformed.should.be.eql('new');
    });

    it('obj 2', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { 
            $assign: {
                'id':  2  
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
