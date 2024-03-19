import Jsx from '../src';

describe('jsx:join', function () {
    it('array', function () {
        let array = ['a', 'b', 'c'];

        let transformed = Jsx.evaluate(array, { $join: '|' });
        //console.log(transformed)
        transformed.should.be.eql('a|b|c');
    });

    it('string', function () {
        let array = 'abc';

        should.throws(
            () => Jsx.evaluate(array, { $join: '|' }),
            'The value to take a "join" operator must be an array.'
        );
    });
});
