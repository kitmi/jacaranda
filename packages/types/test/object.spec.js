import { Types } from "../src";

const { object } = Types;

describe("object", () => {
    it("should have the correct name", () => {
        object.name.should.equal("object");
    });

    it("should have the correct alias", () => {
        object.alias.should.eql(['json']);
    });

    it("should have the correct default value", () => {
        object.defaultValue.should.eql({});
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = object.sanitize(null, {optional: true}, {}, "");
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const value = { foo: "bar" };
            const result = object.sanitize(value, { rawValue: true }, {}, "");
            result.should.eql(value);
        });

        it("should return the sanitized object for object input", () => {
            const value = { foo: "bar", baz: "123" };
            const validationObject = { schema: { foo: { type: "string" }, baz: { type: "number" } } };
            const result = object.sanitize(value, validationObject, {}, "");
            result.should.eql({ foo: "bar", baz: 123 });
        });

        it("should return the sanitized object for JSON input", () => {
            const value = `{ "foo": "bar", "baz": "123" }`;
            const validationObject = { schema: { foo: { type: "string" }, baz: { type: "number" } } };
            const result = object.sanitize(value, validationObject, {}, "");            
            result.should.eql({ foo: "bar", baz: 123 });
        });

        it("should throw a ValidationError for invalid input", () => {
            const value = { foo: "bar", baz: "invalid number" };
            const validationObject = { schema: { foo: { type: "string" }, baz: { type: "number" } } };
            (() => object.sanitize(value, validationObject, {}, "")).should.throw('Invalid number value.');
        });

        it("should keep unsanitized fields if meta.keepUnsanitized is true", () => {
            const value = { foo: "bar", baz: "invalid number" };
            const validationObject = { foo: { type: "string" }, baz: { type: "number" } };
            const meta = { keepUnsanitized: true };
            const result = object.sanitize(value, validationObject, {}, "", meta);
            result.should.eql({ foo: "bar", baz: "invalid number" });
        });
    });

    describe("serialize", () => {
        it("should return null for null input", () => {
            const result = object.serialize(null);
            should.equal(result, null);
        });

        it("should return the serialized JSON string for object input", () => {
            const value = { foo: "bar", baz: 123 };
            const result = object.serialize(value);
            result.should.equal('{"foo":"bar","baz":123}');
        });
    });
});