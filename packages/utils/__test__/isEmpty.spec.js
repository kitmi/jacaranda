import isEmpty from '../src/isEmpty';
import _ from 'lodash';

describe('isEmpty', () => {
    it('should return true for empty values', () => {
        isEmpty(null).should.be.eql(true);
        isEmpty(undefined).should.be.eql(true);
        isEmpty('').should.be.eql(true);
        isEmpty([]).should.be.eql(true);
        isEmpty({}).should.be.eql(true);
        isEmpty(Buffer.from('')).should.be.eql(true);
        isEmpty(new Int16Array()).should.be.eql(true);
        isEmpty(new Map()).should.be.eql(true);
        isEmpty(new Set()).should.be.eql(true);

        (function () {
            return isEmpty(arguments);
        })().should.be.eql(true);
    });

    it('should return false for non-empty values', () => {
        isEmpty(0).should.be.eql(false);
        isEmpty(false).should.be.eql(false);
        isEmpty('hello').should.be.eql(false);
        isEmpty([1]).should.be.eql(false);
        isEmpty({ key: 'ok' }).should.be.eql(false);
        isEmpty(Buffer.from('a')).should.be.eql(false);
        isEmpty(new Int16Array(5)).should.be.eql(false);

        const map1 = new Map();
        map1.set('a', 1);
        isEmpty(map1).should.be.eql(false);
        isEmpty(new Set([1])).should.be.eql(false);

        (function (a) {
            return isEmpty(arguments);
        })(20).should.be.eql(false);
    });

    it('diff with lodash', () => {
        const key = Symbol('key');
        const obj = {
            [key]: 'something'
        };
        _.isEmpty(obj).should.be.true;

        isEmpty(obj).should.be.false;
    });
});
