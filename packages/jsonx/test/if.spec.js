import Jsx from '../src';

describe('Jsx:if', function () {    
    it('wrong usage', function () {
        let obj = {
            key1: 1.11,
        };

        (() => {
            Jsx.evaluate(obj, {
                $if: [
                    { key1:  { $match: { $gt: 0 } } },
                    { $value: 'positive' },
                    { $value: 'non-positive' },
                ],
            }).value.should.be.eql('positive');
        }).should.throw('The evaluated value used as the condition of a "if" operator must be a boolean.');
    });

    it('case 1', function () {
        let obj = {
            key1: 1.11,
        };

        Jsx.evaluate(obj, {
            $if: [
                { $match: { key1: { $gt: 1 } } },
                { $value: 'positive' },
                { $value: 'non-positive' },
            ],
        }).should.be.eql('positive');

        Jsx.evaluate(obj, {
            $if: [
                { $match: { key1: { $gt: 2 } } },
                { $value: 'positive' },
                { $value: 'non-positive' },
            ],
        }).should.be.eql('non-positive');
    });

    it('throw errors', function () {  
        let obj = {
            key1: 1.11,
        };

        should.throws(function () {
            Jsx.evaluate(obj, {
                $if: { key1: { $match: { $gt: 0 } } },
            });
        }, 'The right operand of a "if" operator must be an array.');

        should.throws(function () {
            Jsx.evaluate(obj, {
                $if: [
                    { key1: { $match: { $gt: 0 } } },
                    { $set: 'positive' },
                    { $set: 'non-positive' },
                    { key1: { $lt: 2 } },
                ],
            });
        }, 'The right operand of a "if" operator must be either a 2-tuple or a 3-tuple.');
    });
});
