import batchAsync_ from '../src/batchAsync_';
import eachAsync_ from '../src/eachAsync_';
import filterAsync_ from '../src/filterAsync_';
import findAsync_ from '../src/findAsync_';
import findKeyAsync_ from '../src/findKeyAsync_';
import findKey from '../src/findKey';
import sleep_ from '../src/sleep_';
import size from '../src/size';
import _ from 'lodash';

describe('collection', () => {
    const array = [10, 20, 30, 40];
    const obj = {
        k1: 100,
        k2: 200,
        k3: 300,
        k4: 400,
    };

    it('eachAsync_:array', async () => {
        const r = await eachAsync_(array, async (a) => {
            await sleep_(50);
            return a * 2;
        });

        r.should.be.eql([20, 40, 60, 80]);
    });

    it('eachAsync_:object', async () => {
        const r = await eachAsync_(obj, async (v, k) => {
            await sleep_(50);
            return v + 100;
        });

        r.should.be.eql({
            k1: 200,
            k2: 300,
            k3: 400,
            k4: 500,
        });
    });

    it('filterAsync_:array', async () => {
        const r = await filterAsync_(array, async (a) => {
            await sleep_(50);
            return a > 20;
        });

        r.should.be.eql([30, 40]);
    });

    it('filterAsync_:object', async () => {
        const r = await filterAsync_(obj, async (v, k) => {
            await sleep_(50);
            return k !== 'k3' && v < 400;
        });

        r.should.be.eql({
            k1: 100,
            k2: 200,
        });
    });

    it('findAsync_:array', async () => {
        const r = await findAsync_(array, async (a) => {
            await sleep_(50);
            return a > 20;
        });

        r.should.be.exactly(30);
    });

    it('findKeyAsync_:array', async () => {
        const r = await findKeyAsync_(array, async (a) => {
            await sleep_(50);
            return a > 20;
        });

        r.should.be.exactly(2);
    });

    it('findKey:array', async () => {
        const r = findKey(array, (a) => a > 20);

        r.should.be.exactly(2);
    });

    it('findAsync_:object', async () => {
        const r = await findAsync_(obj, async (v, k) => {
            await sleep_(50);
            return k !== 'k3' && v > 200;
        });

        r.should.be.exactly(400);
    });

    it('findKeyAsync_:object', async () => {
        const r = await findKeyAsync_(obj, async (v, k) => {
            await sleep_(50);
            return k !== 'k3' && v > 200;
        });

        r.should.be.exactly('k4');
    });

    it('findKey:object', async () => {
        const r = findKey(obj, (v, k) => k !== 'k3' && v > 200);

        r.should.be.exactly('k4');
    });

    it('batchAsync_:array', async () => {
        const r = await batchAsync_(array, async (a) => {
            await sleep_(50);
            return a * 2;
        });

        r.should.be.eql([20, 40, 60, 80]);
    });

    it('batchAsync_:object', async () => {
        const r = await batchAsync_(obj, async (v, k) => {
            await sleep_(50);
            return v + 100;
        });

        r.should.be.eql({
            k1: 200,
            k2: 300,
            k3: 400,
            k4: 500,
        });
    });

    it('size', () => {
        size(array).should.be.exactly(4);
        size(obj).should.be.exactly(4);
    });

    it('size diff with lodash', () => {
        const key = Symbol('key');
        const obj = {
            [key]: 'something',
            a: 'others'
        };

        _.size(obj).should.be.exactly(1);
        size(obj).should.be.exactly(2);
    });
});

