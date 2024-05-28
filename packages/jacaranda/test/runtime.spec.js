import { runtime, NS_FEAT } from '../src';

describe('runtime', function () {
    const obj1 = { a: 1 };  

    it('no ns', async function () {
        runtime.register('obj1', obj1);
        const _obj1 = runtime.get('obj1');

        _obj1.should.be.equal(obj1);
    });

    it('ns', async function () {
        runtime.register(NS_FEAT, 'obj1', obj1);
        const _obj1 = runtime.get(NS_FEAT, 'obj1');

        _obj1.should.be.equal(obj1);
    });
});