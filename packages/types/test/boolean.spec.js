import { Types } from "../src";

const { boolean } = Types;

describe("boolean", () => {
    it("should have the correct name", () => {
        boolean.name.should.equal("boolean");
    });

    it("should have the correct alias", () => {
        boolean.alias.should.eql(["bool"]);
    });

    it("should have the correct default value", () => {
        boolean.defaultValue.should.be.false;
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = boolean.sanitize(null, {optional: true}, {});
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const result = boolean.sanitize(true, { rawValue: true }, {});
            result.should.be.true;
        });

        it("should return the boolean value for boolean input", () => {
            const result = boolean.sanitize(true, {}, {});
            result.should.be.true;
        });

        it("should return the boolean value for string input", () => {
            const result = boolean.sanitize("true", {}, {});
            result.should.be.true;
        });

        it("should return the boolean value for number input", () => {
            const result = boolean.sanitize(1, {}, {});
            result.should.be.true;
        });
    });

    describe("serialize", () => {
        it("should return the input value", () => {
            const result = boolean.serialize(true);
            result.should.be.true;
        });
    });
});