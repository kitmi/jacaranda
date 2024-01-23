import Jsx from '../src';

describe('Jsx:find', function () {    
    it('find array', function () {
        let array = [1, 3, 2];

        let transformed = Jsx.evaluate(array, { $find: { $and: [{ $gt: 1 }, {$lt: 3}] } });
        //console.log(transformed)
        transformed.should.be.eql(2);
    });

    it('find obj', function () {
        let obj = {
            key1: 1,
            key2: 3,
            key3: 2,
        };

        let transformed = Jsx.evaluate(obj, { $find: { $and: [{ $gt: 1 }, {$lt: 3}] } });
        //console.log(transformed)
        transformed.should.be.eql(2);
    });

    it('find index from', function () {
        let obj = {
            key1: 1,
            key2: 3,
            key3: 4,
            key4: 5
        };

        let transformed = Jsx.evaluate(obj, { $find: [ { $gt: 1 } , 3] });
        //console.log(transformed)
        transformed.should.be.eql(5);
    });

    it('find index from expr', function () {
        let obj = {
            key1: 1,
            key2: 3,
            key3: 4,

            startFrom: 2
        };

        let transformed = Jsx.evaluate(obj, { $find: [ { $gt: 1 } , { $expr: '$root.startFrom' }] });
        //console.log(transformed)
        transformed.should.be.eql(4);
    });

});
