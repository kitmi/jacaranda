import Jxs from '../src';

describe('Jxs:sanitize', function () {
    it('sanitize', function () {
        const value = { foo: " bar ", baz: "329139" };
            const validationObject = { foo: { type: "text", trim: true }, baz: { type: "number" } };
            const meta = { type: 'object', keepUnsanitized: true, schema: validationObject };
            const result = Jxs.evaluate(value, { $sanitize: meta });
            result.should.be.eql({ foo: "bar", baz: 329139 });
    });
});
