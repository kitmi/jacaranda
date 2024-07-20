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

    it('filter', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    key: 'value',
                    ke2: 'value2',
                },
            });

            const result = await Book.findMany_({
                $where: {
                    testJson: {
                        $filter: {
                            key: 'value',
                        },
                    },
                },
            });

            result.data.length.should.be.exactly(1);
            result.data[0].id.should.be.exactly(insertId);
        });
    });

    it('raw json', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    duration: 20,
                },
            });

            const quizCount = [10, 30];

            const result = await Book.findMany_({
                $where: {
                    $and: [
                        xrRaw(
                            `("testJson"->>'duration')::INTEGER > ${quizCount[0]} AND ("testJson"->>'duration')::INTEGER < ${quizCount[1]}`
                        ),
                    ],
                },
            });

            result.data.length.should.be.exactly(1);

            const result2 = await Book.findMany_({
                $where: {
                    $expr: xrRaw(
                        `("testJson"->>'duration')::INTEGER > ${Book.db.paramToken} AND ("testJson"->>'duration')::INTEGER < ${Book.db.paramToken}`,
                        ...quizCount
                    ),
                },
            });

            result2.data.should.be.eql(result.data);
        });
    });

    it('set json value', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    duration: 20,
                    test: { key1: 1 },
                },
            });

            const { data } = await Book.updateOne_(
                {
                    testJson: {
                        $set: {
                            key: 'test.key2',
                            value: 2,
                        },
                    },
                },
                {
                    $where: {
                        id: insertId,
                    },
                    $getUpdated: true,
                }
            );

            data.should.be.eql({
                id: insertId,
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: { test: { key1: 1, key2: 2 }, duration: 20 },
            });
        });
    });

    it('set array value', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book3');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                array: ['value1'],
            });

            const { data } = await Book.updateOne_(
                {
                    array: {
                        $set: {
                            at: 2,
                            value: 'value2',
                        },
                    },
                },
                {
                    $where: {
                        id: insertId,
                    },
                    $getUpdated: true,
                }
            );

            data.should.be.eql({
                id: insertId,
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                array: ['value1', 'value2'],
            });
        });
    });

    it('get array value', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book3');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                array: ['value1', 'value2'],
            });

            const data = await Book.findOne_({
                $where: {
                    id: insertId,
                },
                $select: [xrGet('array', 2, 'arrayValue')],
            });

            data.arrayValue.should.be.exactly('value2');
        });
    });

    it('get jso  value', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                testJson: {
                    duration: 20,
                    test: { key1: 1, key2: 2 },
                },
            });

            const data = await Book.findOne_({
                $where: {
                    id: insertId,
                },
                $select: [xrGet('testJson', 'test.key2', 'jsonValue')],
            });

            data.jsonValue.should.be.exactly(2);
        });
    });
});
