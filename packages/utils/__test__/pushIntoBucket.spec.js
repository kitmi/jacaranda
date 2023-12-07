import get from '../src/get';
import pushIntoBucket from '../src/pushIntoBucket';

describe('pushIntoBucket', () => {
    it('put into a bucket', function () {
        let obj = {
            k1: [1],
            k2: {
                k22: 2,
            },
        };

        let bucket1 = pushIntoBucket(obj, 'k1', 10);
        let bucket2 = pushIntoBucket(obj, 'k2.k22', 20);
        let bucket3 = pushIntoBucket(obj, 'k3', 3);
        pushIntoBucket(obj, 'k3', 30);

        bucket1.length.should.be.exactly(2);
        bucket2.length.should.be.exactly(2);
        bucket3.length.should.be.exactly(2);

        bucket1[1].should.be.exactly(10);
        bucket2[1].should.be.exactly(20);
        bucket3[0].should.be.exactly(3);
        bucket3[1].should.be.exactly(30);
    });

    it('put array into a bucket', function () {
        let obj = {
            k1: [1],
            k2: {
                k22: 2,
            },
        };

        pushIntoBucket(obj, 'k1', [10]);

        let k1 = get(obj, 'k1');
        Array.isArray(k1).should.be.ok;

        k1.length.should.be.exactly(2);
        Array.isArray(k1[1]).should.be.ok;

        pushIntoBucket(obj, 'k1', [20, 30], true);
        k1 = get(obj, 'k1');

        k1.length.should.be.exactly(4);
        k1[2].should.be.exactly(20);
        k1[3].should.be.exactly(30);
    });
});
