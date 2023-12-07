import Jxs from '../src';

const esTemplateSetting = {
    interpolate: /\$\{([\s\S]+?)\}/g,
};

describe('jxs:interpolate', function () {

    it('template', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate('id:{{user}}:agency:{{agency}}', { '$interpolate': obj });
        //console.log(transformed)
        transformed.should.be.eql(
            'id:100:agency:1'
        );
    });

    it('template 2', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate('id:${user}:agency:${agency}', { '$interpolate': [ obj, esTemplateSetting ] });
        //console.log(transformed)
        transformed.should.be.eql(
            'id:100:agency:1'
        );
    });

    it('template es6', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate('id:${user}:agency:${agency}', { '$interpolate': [ obj, 'es6' ] });
        //console.log(transformed)
        transformed.should.be.eql(
            'id:100:agency:1'
        );
    });
});
