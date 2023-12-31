import { Types } from "../src";

const { integer } = Types;

describe("integer", () => {
    it("should have the correct name", () => {
        integer.name.should.equal("integer");
    });

    it("should have the correct alias", () => {
        integer.alias.should.eql(["int"]);
    });

    it("should have the correct default value", () => {
        integer.defaultValue.should.equal(0);
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = integer.sanitize(null, {optional: true}, {}, "");
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const value = 123;
            const result = integer.sanitize(value, { plain: true }, {}, "");
            result.should.equal(value);
        });

        it("should return the integer value for integer input", () => {
            const value = 123;
            const result = integer.sanitize(value, {}, {}, "");
            result.should.equal(value);
        });

        it("should return the integer value for float input", () => {
            const value = 123.32893;
            const result = integer.sanitize(value, {}, {}, "");
            result.should.equal(123);
        });

        it("should return the integer value for string input", () => {
            const value = "123";
            const result = integer.sanitize(value, {}, {}, "");
            result.should.equal(123);
        });

        it("should throw a ValidationError for invalid string input", () => {
            const value = "invalid integer";
            (() => integer.sanitize(value, {}, {}, "")).should.throw('Invalid integer value.');
        });

        it("should throw a ValidationError for invalid input", () => {
            const value = {};
            (() => integer.sanitize(value, {}, {}, "")).should.throw('Invalid integer value.');
        });
    });

    describe('enum', () => {
        it('in enumerable', () => {
            const value = 123;
            const result = integer.sanitize(value, { enum: [ 123, 100 ] });
            result.should.equal(value);
        });

        it('not in enumerable', () => {
            const value = 123;
            (() => integer.sanitize(value, { enum: [ 100 ] })).should.throw('Invalid enum value.');
        });
    });
});