import testShouldThrow_ from '@kitmi/utils/testShouldThrow_';
import { Types } from '../src';

const { object } = Types;

describe('object-dyn-keys', () => {
    const valueSchema = {
        type: 'object',
        schema: {
            address: { type: 'text' },
            value: { type: 'integer' },
        },
    };

    it('validate object with dynamic keys', () => {
        const stores = {
            store1: {
                address: 'address1',
                value: 1000,
            },
            store2: {
                address: 'address2',
                value: 2000,
            },
        };

        const result = object.sanitize(stores, { valueSchema });
        result.should.eql(stores);
    });

    it('validate object with dynamic keys - false', () => {
        const stores = {
            store1: {
                address: 'address1',
                value: 'fef',
            },
            store2: {
                address: 'address2',
                value: 'feaf',
            },
        };

        (() => object.sanitize(stores, { valueSchema })).should.throws('Invalid integer value.');
    });

    it('validate object with dynamic keys async', async () => {
        const stores = {
            store1: {
                address: 'address1',
                value: 1000,
            },
            store2: {
                address: 'address2',
                value: 2000,
            },
        };

        const result = await object.sanitize_(stores, { valueSchema });
        result.should.eql(stores);
    });

    it('validate object with dynamic keys async - false', async () => {
        const stores = {
            store1: {
                address: 'address1',
                value: 'fef',
            },
            store2: {
                address: 'address2',
                value: 'feaf',
            },
        };

        await testShouldThrow_(() => object.sanitize_(stores, { valueSchema }), 'Invalid integer value.');
    });
});
