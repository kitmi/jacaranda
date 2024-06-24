describe('crud complex', function () {
    it('create & find', async function () {
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

            const result = await Product.findOne_({
                id: insertId,
                $select: ['*'],
                $relation: ['category', 'assets.resource', 'attributes', 'variants'],
            });

            console.log(result);

            const ProductCategory = db.entity('productCategory');
            const category = await ProductCategory.findOne_({ $select: ['*'], id: 2 });

            console.log(category);

            result[':category'].should.eql(category);
            result[':assets'].length.should.eql(3);
            result[':attributes'].length.should.eql(2);
            result[':variants'].length.should.eql(6);
        });
    });
});
