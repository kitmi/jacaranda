import { Types } from "../src";

const { array } = Types;

describe('array', () => {

    describe("sanitizeArray", () => {
        it("should return null for null input (optional)", () => {
            should.not.exist(array.sanitize(null, { type: "array", optional: true }, {}, "test"));
        });

        it("should return null for null input", () => {
            should.throws(() => array.sanitize(null, { type: "array" }, {}, "test"), 'Missing a required value.');
        });

        it("should return rawValue", () => {
            const value = 'fjeioajfiojf';
            array.sanitize('fjeioajfiojf', { plain: true }, {}, "test").should.be.eql(value);
        });

        it("should parse a comma-separated string into an array", () => {
            array.sanitize("1,2,3", { type: "array", csv: true }, {}, "test").should.eql(["1", "2", "3"]);
        });

        it("should not parse a semicolon-separated string into an array without the csv flag", () => {
            (() => array.sanitize("1;2;3", { type: "array", delimiter: ";" }, {}, "test")).should.throws("Invalid array value.");
        });

        it("should parse a semicolon-separated string into an array with csv flag", () => {
            array.sanitize("1;2;3", { type: "array", csv: true, delimiter: ";" }, {}, "test").should.eql(["1", "2", "3"]);
        });

        it("should parse a JSON string into an array", () => {
            array.sanitize("[1,2,3]", { type: "array" }, {}, "test").should.eql([1, 2, 3]);
        });

        it("should throw an error for invalid input", () => {
            (() => array.sanitize("invalid", { type: "array" }, {}, "test")).should.throws("Invalid array value.");
        });

        it("should sanitize array elements according to the element schema", () => {
            const element = { type: "integer" };
            array.sanitize(["1", "2", "3"], { type: "array", element }, {}, "test").should.eql([1, 2, 3]);
        });
    });

    describe("serialize", () => {
        it('should return null for null input', () => {
            should.not.exist(array.serialize(null, { type: "array" }));
        });

        it('should return JSON', () => {
            const value = [ 3, '34', null, 456.898, { a: 'b' } ];
            array.serialize(value, { type: "array" }).should.eql(JSON.stringify(value));
        });
    });

});