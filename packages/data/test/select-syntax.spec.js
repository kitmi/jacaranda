const testData = {
    name: 'Book 1',
    desc: 'Book 1 desc',
};

describe('crud bvt', function () {
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
            const result = await Product.findMany_({
                $select: ['*', 'category.*'],
            });

            should.exist(result.data[0][':category'].name);
            should.exist(result.data[0][':category'].desc);

            const result2 = await Product.findMany_({
                $select: ['*', 'category.name'],
            });

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
});
