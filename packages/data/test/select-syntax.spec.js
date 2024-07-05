const testData = {
    name: 'Book 1',
    desc: 'Book 1 desc',
};

describe('select-syntax', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            await Book.deleteAll_();

            await Book.create_(testData);

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(1);
        });
    });

    it('select with exclusion', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            const result = await Book.findMany_({
                $select: ['* -desc'],
            });

            should.exist(result.data[0].name);
            should.not.exist(result.data[0].desc);
        });
    });

    it('select with cascade', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            /*
            const result = await Product.findMany_({
                $select: ['*', 'category.*'],
            });            

            should.exist(result.data[0][':category'].name);
            should.exist(result.data[0][':category'].desc);
            */

            const result2 = await Product.findMany_({
                $select: ['*', 'category.name'],
            });

            //console.dir(result2.data, { depth: 10 });

            should.exist(result2.data[0][':category'].name);
            should.not.exist(result2.data[0][':category'].desc);
        });
    });

    it('select with cascade exclusion', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            const result = await Product.findMany_({
                $select: ['*', 'category.* -desc'],
            });

            should.exist(result.data[0][':category'].name);
            should.not.exist(result.data[0][':category'].desc);
        });
    });

    it('select with overlapped columns', async function () {
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

            const result = await Product.findMany_({
                $select: [
                    '* -image',
                    'category.*',
                    'category.attributeTypes.attribute',
                    'category.attributeTypes.attribute.dataType',
                ],
                $where: { id: insertId },
            });

            should.not.exist(result.data[0].image);
        });
    });
});
