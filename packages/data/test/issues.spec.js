describe('issues', function () {
    it('multi-level child tables', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            const result = await Product.findMany_({
                $relation: ['assets.somethings'],
            });

            result.op.should.equal('SELECT');
            result.data.length.should.be.above(1);
        });
    });

    it.only('and expression', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            /*
            const Product = db.entity('product');
            const result = await Product.findMany_({
                $where: {
                    $and: [
                        { id: { $gt: 1 } },
                        { id: { $lt: 10 } },
                    ],
                },
            });

            result.op.should.equal('SELECT');
            console.log(result.data);
            */            
        });
    });
});
