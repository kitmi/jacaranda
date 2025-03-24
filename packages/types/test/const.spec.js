import { Types } from '../src';

describe('const', () => {
    it('object', () => {
        const result = Types.OBJECT.sanitize(
            { key: 'value' },
            { type: 'object', schema: { key: { type: 'text', const: 'value' } } }
        );
        result.should.eql({ key: 'value' });

        (() => {
            Types.OBJECT.sanitize(
                { key: 'value' },
                { type: 'object', schema: { key: { type: 'text', const: 'value2' } } }
            );
        }).should.Throw('Invalid constant value.');
    });
});
