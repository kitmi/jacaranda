describe('complex-find with limit orm', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            await Product.deleteAll_({ $physical: true });

            const result = await Product.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('limit with joining orm', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            for (let i = 1; i < 5; i++) {
                const { op, data, affectedRows, insertId } = await Product.create_({
                    'type': 'good',
                    'name': `Demo Product ${i}`,
                    'desc': 'Demo Product Description 2',
                    'image': 'https://example.com/demo.jpg',
                    'thumbnail': 'https://example.com/demo-thumb.jpg',
                    'free': true,
                    'openToGuest': true,
                    'isPackage': false,
                    'hasVariants': false,
                    'category': 2,
                    ':assets': [
                        {
                            'tag': 'snapshots',
                            ':resource': {
                                mediaType: 'image',
                                url: 'https://example.com/demo-asset.jpg',
                            },
                        },
                        {
                            'tag': 'snapshots',
                            ':resource': {
                                mediaType: 'image',
                                url: 'https://example.com/demo-asset2.jpg',
                            },
                        },
                        {
                            'tag': 'poster',
                            ':resource': {
                                mediaType: 'image',
                                url: 'https://example.com/demo-poster.jpg',
                            },
                        },
                    ],
                    ':attributes': [
                        {
                            type: 'dimension',
                            value: '10x10x10',
                        },
                        {
                            type: 'origin',
                            value: 'China',
                        },
                    ],
                    ':variants': [
                        {
                            type: 'color',
                            value: 'red',
                        },
                        {
                            type: 'color',
                            value: 'blue',
                        },
                        {
                            type: 'color',
                            value: 'green',
                        },
                        {
                            type: 'size',
                            value: 'L',
                        },
                        {
                            type: 'size',
                            value: 'M',
                        },
                        {
                            type: 'size',
                            value: 'S',
                        },
                    ],
                });

                op.should.equal('INSERT');
                (insertId > 0).should.be.ok;
                affectedRows.should.equal(1);
            }

            let result = await Product.findMany_({
                $relation: ['category', 'assets.resource', 'attributes', 'variants'],
                $limit: 2,
            });

            result.data.length.should.be.exactly(2);

            result = await Product.findMany_({
                $relation: ['category', 'assets.resource', 'attributes', 'variants'],
                $orderBy: { id: true },
                $limit: 3,
            });

            result.data.length.should.be.exactly(3);
            result.data[0].id.should.lessThan(result.data[1].id);
            result.data[1].id.should.lessThan(result.data[2].id);

            result = await Product.findMany_({
                $relation: ['category', 'assets.resource', 'attributes', 'variants'],
                $orderBy: { id: false },
                $limit: 4,
            });

            result.data.length.should.be.exactly(4);
            result.data[0].id.should.greaterThan(result.data[1].id);
            result.data[1].id.should.greaterThan(result.data[2].id);
            result.data[2].id.should.greaterThan(result.data[3].id);
        });
    });
});
