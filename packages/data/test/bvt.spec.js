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
            });
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
});
