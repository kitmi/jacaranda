import Jxs from '../src';

describe('jsv:objectToArray', function () {

    it('toArray default', function () {
        let obj = {
            'id': 1,
            ':user': { email: 'email1', other: 'any' }
        };

        let transformed = Jxs.evaluate(obj, '$toArray');
        //console.log(transformed)
        transformed.should.be.eql([{ name: 'id', value: 1 }, { name: ':user', value: { email: 'email1', other: 'any' } }]);
    });

    it('toArray key value', function () {
        let obj = {
            'id': 1,
            ':user': { email: 'email1', other: 'any' }
        };

        let transformed = Jxs.evaluate(obj, { $toArray: { key: '$$KEY', value: '$$CURRENT' } });
        //console.log(transformed)
        transformed.should.be.eql([{ key: 'id', value: 1 }, { key: ':user', value: { email: 'email1', other: 'any' } }]);
    });

});
