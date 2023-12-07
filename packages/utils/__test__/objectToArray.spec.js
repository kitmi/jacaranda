import objectToArray from '../src/objectToArray';

describe('objectToArray', () => {
    const obj = {
        a: 10,
        b: 20,
        c: 30,
        d: 40,
    };

    const a1 = [
        { name: 'a', value: 10 },
        { name: 'b', value: 20 },
        { name: 'c', value: 30 },
        { name: 'd', value: 40 },
    ];

    const a2 = [
        { key: 'a', value: 10 },
        { key: 'b', value: 20 },
        { key: 'c', value: 30 },
        { key: 'd', value: 40 },
    ];

    const a3 = [
        { key: 'a', val: 10 },
        { key: 'b', val: 20 },
        { key: 'c', val: 30 },
        { key: 'd', val: 40 },
    ];

    const a4 = [
        { name: 'a', val: 10 },
        { name: 'b', val: 20 },
        { name: 'c', val: 30 },
        { name: 'd', val: 40 },
    ];

    it('objectToArray 1', () => {
        const r1 = objectToArray(obj);
        r1.should.be.eql(a1);
    });

    it('objectToArray 2', () => {
        const r1 = objectToArray(obj, 'key');
        r1.should.be.eql(a2);
    });

    it('objectToArray 3', () => {
        const r1 = objectToArray(obj, 'key', 'val');
        r1.should.be.eql(a3);
    });

    it('objectToArray 4', () => {
        const r1 = objectToArray(obj, null, 'val');
        r1.should.be.eql(a4);
    });

    it('objectToArray element builder', () => {
        const r1 = objectToArray(obj, (v, k) => ({ name: k, val: v }));
        r1.should.be.eql(a4);
    });
});
