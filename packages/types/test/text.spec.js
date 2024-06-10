import { Types } from "../src";

const { text } = Types;

describe("text", () => {
    it("should have the correct name", () => {
        text.name.should.equal("text");
    });

    it("should have the correct alias", () => {
        text.alias.should.eql(["string"]);
    });

    it("should have the correct default value", () => {
        text.defaultValue.should.equal("");
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = text.sanitize(null, {optional: true}, {}, "");
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const value = "foo";
            const result = text.sanitize(value, { plain: true }, {}, "");
            result.should.equal(value);
        });

        it("should return the input value for non-empty string input", () => {
            const value = "foo";
            const result = text.sanitize(value, {}, {}, "");
            result.should.equal(value);
        });

        it("should return null for empty string input with meta.emptyAsNull", () => {
            const value = "";
            should.throws(() => text.sanitize(value, { emptyAsNull: true }, {}, ""), 'Missing a required value.');
        });

        it("should return string for numbers", () => {
            const value = 123;
            text.sanitize(value, {}, {}, "").should.equal("123");
        });

        it("should throw a ValidationError for non-string input", () => {
            const value = {};
            should.throws(() => text.sanitize(value, {}, {}, ""), 'Invalid text value.');
        });
    });

    describe('enum', () => {
        it('in enumerable', () => {
            const value = 'ok';
            const result = text.sanitize(value, { enum: [ 'ok', 'ng' ] });
            result.should.equal(value);
        });

        it('not in enumerable', () => {
            const value = 'ok';
            (() => text.sanitize(value, { enum: [ 'ng', 'some' ] })).should.throw('Invalid enum value.');
        });
    });
});