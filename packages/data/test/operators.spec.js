import { xrRaw, xrGet, xrSet, xrSetAt, xrSetSlice } from '../src';

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
                    testJson: xrSet({
                        'duration': 30,
                        'test.key2': 2,
                        'key3': 'string',
                        'key4': null,
                    }),
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
                testJson: { test: { key1: 1, key2: 2 }, duration: 30, key3: 'string', key4: null },
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
                    array: xrSetAt(2, 'value2'),
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

    it('set array slice', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book3');

            const { insertId } = await Book.create_({
                name: 'JSON Book',
                desc: "This is a book with 'JSON' in its name",
                array: ['value1', 'value2', 'value3'],
            });

            const { data } = await Book.updateOne_(
                {
                    array: xrSetSlice(2, 3, ['set2', 'set3']),
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
                array: ['value1', 'set2', 'set3'],
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

    it('get json value', async function () {
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
