import { Types, addPlugin } from "../src";

const { bigint } = Types;

addPlugin('bigintWriter', (value) => {
    return value.toString() + 'n';
});

describe("bigint", () => {
    it("should have the correct name", () => {
        bigint.name.should.equal("bigint");
    });

    it("should have the correct alias", () => {
        bigint.alias.should.eql(["biginteger"]);
    });

    it("should have the correct default value", () => {
        bigint.defaultValue.should.equal(0n);
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = bigint.sanitize(null, { optional: true}, {}, "");
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const value = 123n;
            const result = bigint.sanitize(value, { rawValue: true }, {}, "");
            result.should.equal(value);
        });

        it("should return the BigInt value for number input", () => {
            const value = 123;
            const result = bigint.sanitize(value, {}, {}, "");
            result.should.equal(123n);
        });

        it("should return the BigInt value for string input", () => {
            const value = "123";
            const result = bigint.sanitize(value, {}, {}, "");
            result.should.equal(123n);
        });

        it("should throw a ValidationError for invalid string input", () => {
            const value = "invalid bigint";
            (() => bigint.sanitize(value, {}, {}, "")).should.throw('Invalid bigint value.');
        });

        it("should throw a ValidationError for invalid input", () => {
            const value = {};
            (() => bigint.sanitize(value, {}, {}, "")).should.throw('Invalid bigint value.');
        });
    });

    describe('serialze', () => {
        it('should return the string value', () => {
            const value = 123n;
            const result = bigint.serialize(value, {}, {}, "");
            result.should.equal('123n');
        });
    });

    describe('enum', () => {
        it('in enumerable', () => {
            const value = 123n;
            const result = bigint.sanitize(value, { enum: [ 123n, 100n ] });
            result.should.equal(value);
        });

        it('not in enumerable', () => {
            const value = 123n;            
            (() => bigint.sanitize(value, { enum: [ 100n ] })).should.throw('Invalid enum value.');
        });
    });
});