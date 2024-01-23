import Jxs from '../src';

describe('Jxs:bugs', function () {
    it('bug - match context', function () {        
        const obj = {
            maxIndex: 3,
            index: 2
        };

        const result = Jxs.evaluate(obj, [{
            $valueOf: 'index'
        },
        {
            $match: { $expr: '$$ROOT.maxIndex' }
        }]);

        result.should.be.false;

        const obj2 = {
            maxIndex: 3,
            index: 3
        };

        const result2 = Jxs.evaluate(obj2, [{
            $valueOf: 'index'
        },
        {
            $match: { $expr: '$$ROOT.maxIndex' }
        }]);

        result2.should.be.true;
    });
});
