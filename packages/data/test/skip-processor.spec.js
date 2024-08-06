const testData = {
    name: 'Book 1',
};

describe.only('skip processor', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book4');
            await Book.deleteAll_({ $physical: true });

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('create & update', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book4');
            const { data, insertId: id1 } = await Book.create_(testData, { $getCreated: true });
            data.name.should.eql(testData.name.toUpperCase());

            const { data: data2, insertId: id2 } = await Book.create_(testData, {
                $skipProcessors: ['toUpper'],
                $getCreated: true,
            });
            data2.name.should.eql(testData.name);

            const { data: data3 } = await Book.create_(testData, {
                $skipProcessors: ['name.toUpper'],
                $getCreated: true,
            });
            data3.name.should.eql(testData.name);

            const { data: data4 } = await Book.updateOne_(
                {
                    name: testData.name,
                },
                {
                    $where: { id: id2 },
                    $getUpdated: true,
                }
            );
            data4.name.should.eql(testData.name.toUpperCase());

            const { data: data5 } = await Book.updateOne_(
                {
                    name: testData.name,
                },
                {
                    $where: { id: id1 },
                    $skipProcessors: ['toUpper'],
                    $getUpdated: true,
                }
            );
            data5.name.should.eql(testData.name);
        });
    });
});
