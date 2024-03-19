import Jsx from '../src';

describe('Jsx:remap', function () {
    it('obj', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { $remap: { user: 'username' } });
        //console.log(transformed)
        transformed.should.be.eql({ username: 100 });
    });

    it('array', function () {
        let array = [
            {
                'id': 1,
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
        ];

        let transformed = Jsx.evaluate(array, { '|>$remap': { user: 'username' } });
        //console.log(transformed)
        transformed.should.be.eql([{ username: 100 }]);
    });

    it('remap keep unmapped', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jsx.evaluate(obj, { $remap: [{ user: 'username' }, true ] });
        //console.log(transformed)
        transformed.should.be.eql({
            'id': 1,
            'username': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });
});
