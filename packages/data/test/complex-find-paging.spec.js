describe('complex-find with paging', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            await Product.deleteAll_({ $physical: true });

            const result = await Product.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('find many with $countBy', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            const { op, data, affectedRows, insertId } = await Product.create_({
                'type': 'good',
                'name': 'Demo Product 2',
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

            const result = await Product.findMany_({
                $relation: ['category', 'assets.resource', 'attributes', 'variants'],
                $countBy: 'id',
            });

            result.totalCount.should.be.exactly(result.data.length);
        });
    });
});
