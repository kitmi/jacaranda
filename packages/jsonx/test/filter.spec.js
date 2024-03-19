import Jsx from '../src';

describe('jsx:filter', function () {   

    it('filterNull', function () {
        let obj = {
            a: 10,
            b: null,
            c: 30,
        }

        Jsx.evaluate(obj, '$filterNull').should.be.eql({
            a: 10,
            c: 30,
        });
    });

    it('filter by value', function () {
        const obj = {
            a: true,
            b: true,
            c: true,
            d: false
        };

        const result = Jsx.evaluate(obj, [
            {
                "$filterByValue": { $eq: true }
            },
            '$size'
        ]);
        
        result.should.be.eql(3);
    } );

    it('filter by value 2', function () {
        const obj = {
            a: true,
            b: true,
            c: true,
            d: false
        };

        const result = Jsx.evaluate(obj, [
            {
                "$filterByValue": true
            },
            '$size'
        ]);
        
        result.should.be.eql(3);
    } );
});
