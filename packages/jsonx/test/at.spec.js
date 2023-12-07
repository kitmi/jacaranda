import Jxs from '../src';

describe('jxs:at', function () {

    it('array', function () {
        let array = [1,2,3];
        
        let transformed = Jxs.evaluate(array, {'$at' : 0});
        //console.log(transformed)
        transformed.should.be.eql(
            1
        );

        transformed = Jxs.evaluate(array, {'$at' : -1});
        //console.log(transformed)
        transformed.should.be.eql(
            3
        );
    });
});
