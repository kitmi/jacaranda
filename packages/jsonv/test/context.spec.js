import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe.only('jsv:context', function () {
    const obj = {
        type: 'object',
        schema: {
            trustProxy: { type: 'boolean', optional: true },
            subdomainOffset: { type: 'integer', optional: true, post: [['~min', 2]] },
            port: { type: 'integer', optional: true, default: 2331 },
            keys: [
                {
                    type: 'text',
                },
                {
                    type: 'array',
                    optional: true,
                    element: { type: 'text' },
                    post: [['~minLength', 1]],
                },
            ],
        },
        optional: true,
    };

    const array = {
        type: 'array',
        element: {
            type: 'integer',
        },
    };

    const jsv = {
        type: {
            $in: ['object', 'array', 'text'],
        },
        schema: {
            $if: [ { $expr: ['$parent.type', { $match: { $eq: 'object' } }] }, { $required: true }],
        },
        element: {
            $if: [
                { $expr: ['$parent.type', { $match: { $eq: 'array' } } ] },
                [{ $required: true }, [{ type: { $in: ['text', 'integer'] } }]],
            ],
        },
    };

    it('when type is object, it should have schema', function () {
        let result = Jsv.match(obj, jsv);
        result[0].should.be.ok;
    });

    it('when type is array, it should have element', function () {
        let result = Jsv.match(array, jsv);
        result[0].should.be.ok;
    });

    it('invalid object 1', function () {
        let result = Jsv.match({
            type: 'array',
            schema: {
                trustProxy: { type: 'boolean', optional: true },
            }
        }, jsv);
        result[0].should.not.be.ok;
        result[1].should.be.eql('"element" is required.');
    });
});
