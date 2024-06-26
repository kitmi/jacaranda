let firstId;
let lastId;

let count = 10;

const testData = {
    name: 'Book ',
    desc: 'This is a book',
};

describe('query operators', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            await Book.deleteAll_();

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);

            for (let i = 1; i <= count; i++) {
                const { insertId } = await Book.create_({
                    name: testData.name + i,
                    desc: testData.desc,
                });

                if (i === 1) {
                    firstId = insertId;
                }

                if (i === count) {
                    lastId = insertId;
                }
            }

            const result2 = await Book.findMany_({});
            result2.data.length.should.be.exactly(count);
        });
    });

    it('between', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({
                $where: {
                    id: {
                        $between: [firstId + 1, lastId - 1],
                    },
                },
            });

            result.data.length.should.be.exactly(count - 2);
        });
    });

    it('not between', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({
                $where: {
                    id: {
                        $notBetween: [firstId + 1, lastId - 1],
                    },
                },
            });

            result.data.length.should.be.exactly(2);
        });
    });

    it('in', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({
                $where: {
                    id: {
                        $in: [firstId, lastId],
                    },
                },
            });

            result.data.length.should.be.exactly(2);
        });
    });

    it('not in', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({
                $where: {
                    id: {
                        $notIn: [firstId, lastId],
                    },
                },
            });

            result.data.length.should.be.exactly(count - 2);
        });
    });

    it('like', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({
                $where: {
                    name: {
                        $like: '3',
                    },
                },
            });

            result.data.length.should.be.exactly(1);
        });
    });
});
