import { xrRaw, xrGet } from '../src';

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

    it('get jso  value', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    duration: 20,
                    test: { key1: 1, key2: 2 },
                },
            });

            await Book.create_({
                name: 'JSON Book 2',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    duration: 10,
                    test: { key1: 1, key2: 2 },
                },
            });

            const { data } = await Book.findMany_({
                $select: ['*', xrGet('testJson', 'duration', 'duration')],
                $orderBy: {
                    duration: 1,
                },
            });
        });
    });
});
