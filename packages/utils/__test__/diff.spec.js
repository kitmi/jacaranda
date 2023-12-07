'use strict';

import take from '../src/take';

const data = {
    key1: 'value',
    key2: 'value',
    key3: 'value',
    key4: 'value',
    key5: 'value',
    key6: 'value',
    key7: 'value',
    key8: 'value',
    key9: 'value',
    key10: 'value',
    key11: 'value',
    key12: 'value',
    key13: 'value',
    key14: 'value',
    key15: 'value',
};

describe('take', function () {
    it('default n', async function () {
        take(data).should.be.eql({ key1: 'value' });
    });

    it('n < length', async function () {
        take(data, 5).should.be.eql({
            key1: 'value',
            key2: 'value',
            key3: 'value',
            key4: 'value',
            key5: 'value',
        });
    });

    it('n > length', async function () {
        take(data, 20).should.be.eql(data);
    });

    it('n = length', async function () {
        take(data, 15).should.be.eql(data);
    });
});
