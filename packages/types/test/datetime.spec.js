import { Types, addPlugin } from "../src";
import { DateTime } from 'luxon';

const { datetime } = Types;

addPlugin("datetimeParser", (value, { format, timezone }) => DateTime.fromFormat(value, format, { zone: timezone || 'local' }).toJSDate());

describe("datetime", () => {
    it("should have the correct name", () => {
        datetime.name.should.equal("datetime");
    });

    it("should have the correct alias", () => {
        datetime.alias.should.eql(["date", "time", "timestamp"]);
    });

    it("should have the correct default value", () => {
        datetime.defaultValue.should.eql(new Date(0));
    });

    describe("sanitize", () => {
        it("should return null for null input", () => {
            const result = datetime.sanitize(null, {optional: true}, {}, "");
            should.equal(result, null);
        });

        it("should return the input value for rawValue input", () => {
            const value = new Date();
            const result = datetime.sanitize(value, { rawValue: true }, {}, "");
            result.should.equal(value);
        });

        it("should return the Date object for Date input", () => {
            const value = new Date();
            const result = datetime.sanitize(value, {}, {}, "");
            result.should.equal(value);
        });

        it("should return a Date object for string input", () => {
            const value = "2022-01-01T00:00:00.000Z";
            const result = datetime.sanitize(value, {}, {}, "");
            result.should.eql(new Date(value));
        });

        it("should return a Date object for date only string input", () => {
            const value = "2022-01-01";
            const result = datetime.sanitize(value, {}, {}, "");
            result.should.eql(new Date('2022-01-01T00:00:00.000Z'));
        });

        it("should return null for invalid string input", () => {
            const value = "invalid date";
            (() => datetime.sanitize(value, {}, {}, "")).should.throw('Invalid datetime value.');

        });

        it("should return a Date object for format options", () => {
            const value = "2022/01/01";
            const result = datetime.sanitize(value, { format: "yyyy/MM/dd" }, { timezone: "Australia/Sydney" });
            
            result.should.eql(new Date('2021-12-31T13:00:00.000Z'));
        });

        it("should return null for invalid input", () => {
            const value = {};
            (() => datetime.sanitize(value, {}, {}, "")).should.throw('Invalid datetime value.');
        });
    });
});