import arrayToObject from '../src/arrayToObject.js';

describe('arrayToObject', () => {
    const obj1 = { key: 'a', value1: 10, value2: 100 };
    const obj2 = { key: 'b', value1: 20, value2: 200 };
    const obj3 = { key: 'c', value1: 30, value2: 300 };
    const obj4 = { key: 'd', value1: 40, value2: 400 };

    const array = [obj1, obj2, obj3, obj4];

    it('arrayToObject 1', () => {
        const r1 = arrayToObject(array, 'key', 'value1');
        r1.should.be.eql({
            a: 10,
            b: 20,
            c: 30,
            d: 40,
        });
    });

    it('arrayToObject 2', () => {
        const r1 = arrayToObject(
            array,
            (obj) => obj.key,
            (obj) => obj.value2
        );
        r1.should.be.eql({
            a: 100,
            b: 200,
            c: 300,
            d: 400,
        });
    });

    it('arrayToObject 3', () => {
        const r1 = arrayToObject(array, (obj) => obj.key);
        r1.should.be.eql({
            a: obj1,
            b: obj2,
            c: obj3,
            d: obj4,
        });
    });
});
