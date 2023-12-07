const _ = require('lodash');
const chai = require('chai');
chai.use(function (chai, utils) {
    const Assertion = chai.Assertion;

    // your helpers here
    Assertion.addMethod('throws', function (error) {
        new Assertion(this._obj).Throw(error);
    });

    Assertion.addMethod('toThrow', function (error) {
        new Assertion(this._obj).Throw(error);
    });

    Assertion.addMethod('exactly', function (value) {
        new Assertion(this._obj === value).to.be.ok;
    });

    Assertion.addMethod('toEqual', function (value) {
        new Assertion(_.isEqual(this._obj, value)).to.be.ok;
    });

    Assertion.addProperty('uppercase', function () {
        var obj = this._obj;
        new chai.Assertion(obj).to.be.a('string');

        this.assert(
            obj === obj.toUpperCase(), // adapt as needed
            'expected #{this} to be all uppercase', // error message when fail for normal
            'expected #{this} to not be all uppercase' // error message when fail for negated
        );
    });

    Assertion.addProperty('lowercase', function () {
        var obj = this._obj;
        new chai.Assertion(obj).to.be.a('string');

        this.assert(
            obj === obj.toLowerCase(), // adapt as needed
            'expected #{this} to be all lowercase', // error message when fail for normal
            'expected #{this} to not be all lowercase' // error message when fail for negated
        );
    });

    Assertion.overwriteMethod('keys', function (_super) {
        return function assertKeys(...args) {
            const obj = this._obj;
            args.forEach((arg) => {
                this.assert(
                    _.has(obj, arg),
                    'expected #{this} to have key #{exp}',
                    'expected #{this} to not have key #{exp}',
                    arg
                );
            });
        };
    });
});

global.assert = chai.assert;
global.expect = chai.expect;
global.should = chai.should();

global.should.throws = (func, errorPattern) => {
    func.should.throws(errorPattern);
};
