import Jsx from '../src';

describe('jsx:castArray', function () {
    it('obj', function () {
        let obj = { key: 'any object' };

        let transformed = Jsx.evaluate(obj, '$castArray');
        //console.log(transformed)
        transformed.should.be.eql([obj]);
    });

    it('array', function () {
        let array = [1, 2, 3];

        let transformed = Jsx.evaluate(array, '$castArray');
        //console.log(transformed)
        transformed.should.be.eql(array);
    });

    it('str', function () {
        let str = 'jeoajfi';

        let transformed = Jsx.evaluate(str, '$castArray');
        //console.log(transformed)
        transformed.should.be.eql([str]);
    });

    it('null', function () {
        let a = null;

        let transformed = Jsx.evaluate(a, '$castArray');
        //console.log()
        should.not.exist(transformed);
    });
});
