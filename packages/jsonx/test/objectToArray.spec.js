import Jsx from '../src';

describe('jsx:objectToArray', function () {
    it('simple', function () {
        Jsx.evaluate({ key: 'value' }, '$toArray').should.be.eql([{ name: 'key', value: 'value' }]);
    });

    it('custom', function () {
        Jsx.evaluate({ key: 'value' }, { $toArray: { myKey: '$key', myValue: '$this' } }).should.be.eql([
            { myKey: 'key', myValue: 'value' },
        ]);
    });

    it('toArray default', function () {
        let obj = {
            'id': 1,
            ':user': { email: 'email1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, '$toArray');
        //console.log(transformed)
        transformed.should.be.eql([
            { name: 'id', value: 1 },
            { name: ':user', value: { email: 'email1', other: 'any' } },
        ]);
    });

    it('toArray key value', function () {
        let obj = {
            'id': 1,
            ':user': { email: 'email1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { $toArray: { key: '$key', value: '$this' } });
        //console.log(transformed);
        transformed.should.be.eql([
            { key: 'id', value: 1 },
            { key: ':user', value: { email: 'email1', other: 'any' } },
        ]);
    });
});
