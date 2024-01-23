import Jsv from '../src';
import enUS from '../src/locale/en-US';

Jsv.config.loadMessages('en-US', enUS).setLocale('en-US');

describe('jsv:error', function () {
    it('in null', function () {
        (() => {
            Jsv.match(
                {
                    name: 'jack',
                    index: 3,
                },
                { name: { $in: null } }
            );
        }).should.throw(/The right operand of a "in" operator must be an array./);
    });

    it('not in null', function () {
        (() => {
            Jsv.match(
                {
                    name: 'jack',
                    index: 3,
                },
                { name: { $notIn: null } }
            );
        }).should.throw(/The right operand of a "notIn" operator must be an array./);
    });

    it('exist', function () {
        (() => {
            Jsv.match(
                {
                    name: 'jack',
                    index: 3,
                },
                { name: { $exist: 'fjeifj' } }
            );
        }).should.throw(/The right operand of a "exist" operator must be a boolean./);
    });

    it('required', function () {
        (() => {
            Jsv.match(
                {
                    name: 'jack',
                    index: 3,
                },
                { name: { $required: 'fjeifj' } }
            );
        }).should.throw(/The right operand of a "required" operator must be a boolean./);
    });
});
