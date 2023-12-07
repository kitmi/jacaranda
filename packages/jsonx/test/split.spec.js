import Jxs from '../src';

describe('Jxs:split', function () {   

    it('split 1', function () {
        let array = 'a,b,c';

        Jxs.evaluate(array, { $split: ',' }).should.be.eql(['a', 'b', 'c']);
    });

    it('split 2', function () {
        let array = 'a,b,c';

        Jxs.evaluate(array, { $split: [ ',' , 2 ]}).should.be.eql(['a', 'b']);
    });
});
