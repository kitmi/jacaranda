import Jsx from '../src';

describe('Jsx:math', function () {
    it('add', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $add: 2 });
        //console.log(transformed)
        transformed.should.be.eql(12);
    });

    it('sub', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $sub: 2 });
        //console.log(transformed)
        transformed.should.be.eql(8);
    });

    it('mul', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $mul: 2 });
        //console.log(transformed)
        transformed.should.be.eql(20);
    });

    it('div', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, { '|>$div': 2 });
        //console.log(transformed)
        transformed.should.be.eql([0.5, 1, 1.5]);
    });

    it('mod', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $mod: 3 });
        //console.log(transformed)
        transformed.should.be.eql(1);
    });

    it('pow', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $pow: 3 });
        //console.log(transformed)
        transformed.should.be.eql(1000);
    });

    it('obj', function () {
        let obj = {
            id: 1,
            user: 100,
            agency: 1,
        };

        let transformed = Jsx.evaluate(obj, '$sum');
        //console.log(transformed)
        transformed.should.be.eql(102);
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, '$sum');
        //console.log(transformed)
        transformed.should.be.eql(6);
    });

    it('mul hybid', function () {
        let obj = 10;

        let transformed = Jsx.evaluate(obj, { $mul: { $expr: [{ $value: 10 }, { $add: '5' }] } });
        //console.log(transformed)
        transformed.should.be.eql(150);
    });
});
