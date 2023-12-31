import { Types } from '../src';

const { binary } = Types;

describe('binary', () => {
    it('should have the correct name', () => {
        binary.name.should.equal('binary');
    });

    it('should have the correct alias', () => {
        binary.alias.should.eql(['blob', 'buffer']);
    });

    it('should have the correct default value', () => {
        should.equal(binary.defaultValue, null);
    });

    describe('sanitize', () => {
        it('should return null for null input', () => {
            const result = binary.sanitize(null, { optional: true }, {}, '');
            should.equal(result, null);
        });

        it('should return the input value for rawValue input', () => {
            const value = Buffer.from('foo');
            const result = binary.sanitize(value, { plain: true }, {}, '');
            result.should.eql(value);
        });

        it('should return the input value for Buffer input', () => {
            const value = Buffer.from('foo');
            const result = binary.sanitize(value, {}, {}, '');
            result.should.eql(value);
        });

        it('should return the Buffer value for base64 string input', () => {
            const value = 'Zm9v';
            const result = binary.sanitize(value, {}, {}, '');
            result.should.eql(Buffer.from('foo'));
        });

        it('should return the Buffer value for hex string input', () => {
            const value = '666f6f';
            const result = binary.sanitize(value, { encoding: 'hex' }, {}, '');
            result.should.eql(Buffer.from('foo'));
        });

        it('should throw a ValidationError for invalid input', () => {
            const value = {};
            (() => binary.sanitize(value, {}, {}, '')).should.throw('Invalid binary value.');
        });
    });
});
