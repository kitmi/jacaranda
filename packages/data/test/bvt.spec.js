const testData = {
    name: 'Book 1',
    desc: 'Book 1 desc',
};

describe('crud bvt', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            await Book.deleteAll_({ $physical: true });

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('create & find', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            const { op, data, affectedRows, insertId } = await Book.create_(testData);

            op.should.equal('INSERT');
            data.name.should.eql(testData.name);
            data.desc.should.eql(testData.desc);
            affectedRows.should.equal(1);

            const result = await Book.findOne_({
                $select: ['*'],
                $where: { id: insertId },
            });

            result.should.be.eql({
                id: insertId,
                ...testData,
                testJson: null,
            });

            const result2 = await Book.findOne_(insertId);
            result2.should.be.eql(result);
        });
    });

    it('create, update & find', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            const { insertId } = await Book.create_(testData);

            let result = await Book.updateOne_({ name: 'Book 2' }, { $where: { id: insertId } });
            result.op.should.equal('UPDATE');
            result.affectedRows.should.equal(1);

            result = await Book.updateOne_({ name: 'Book 3' }, { $where: { id: insertId }, $getUpdated: true });
            result.op.should.equal('UPDATE');
            result.data.name.should.equal('Book 3');
            result.affectedRows.should.equal(1);
        });
    });

    it('delete & find', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            const { insertId } = await Book.create_(testData);

            let result = await Book.deleteOne_({ $where: { id: insertId } });
            result.op.should.equal('DELETE');
            result.affectedRows.should.equal(1);

            const data = await Book.findOne_({ $where: { id: insertId } });
            should.not.exist(data);
        });
    });

    it('update many', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            const { insertId: id1 } = await Book.create_(testData);
            const { insertId: id2 } = await Book.create_(testData);
            const { insertId: id3 } = await Book.create_(testData);
            const { insertId: id4 } = await Book.create_(testData);
            const { insertId: id5 } = await Book.create_(testData);

            const { data } = await Book.findMany_({});
            data.length.should.be.gte(5);

            const result = await Book.updateMany_(
                {
                    name: 'Book 1 - 5',
                },
                {
                    $where: { id: { $in: [id1, id2, id3, id4, id5] } },
                }
            );

            result.affectedRows.should.be.exactly(5);
        });
    });
});
