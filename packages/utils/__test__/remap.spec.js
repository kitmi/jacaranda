import remap from '../src/remap';

describe('unit:remap', function () {
    it('remap an object', async function () {
        const source = {
            key1: {
                key1_1: {
                    key1_1_1: 20,
                    key1_1_2: 'test2',
                    key1_1_3: 30,
                },
            },
            key2: true,
            key3: 30,
            key4: 'test',
            key5: ['a', 'b'],
        };

        const mapped = remap(source, {
            key1: [
                'tkey1',
                {
                    key1_1: [
                        'key1_1',
                        {
                            key1_1_1: 'tkey1_1_1',
                            key1_1_3: 'tkey1_1_3',
                        },
                    ],
                },
            ],
            key3: 'tkey3',
            key5: 'tkey5',
        });

        mapped.should.be.eql({
            tkey1: {
                key1_1: {
                    tkey1_1_1: 20,
                    tkey1_1_3: 30,
                },
            },
            tkey3: 30,
            tkey5: ['a', 'b'],
        });
    });
});
