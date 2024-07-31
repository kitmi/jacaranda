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

    it('and expression', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');

            const Product = db.entity('product');
            const result = await Product.findMany_({
                $where: {
                    $and: [{ id: [2, 3, 4] }, { id: { $lt: 10 } }],
                },
            });

            result.op.should.equal('SELECT');
        });
    });

    it('delete unexist', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test');
            const Book = db.entity('book');
            let result = await Book.deleteOne_({
                $where: { id: 100000000 },
            });

            console.log(result);

            result = await Book.deleteMany_({
                $where: { id: { $in: [100000000] } },
            });

            console.log(result);
        });
    });

    it('logical delete unexist', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            let result = await Product.deleteOne_({
                $where: { id: 100000000 },
            });

            console.log(result);

            result = await Product.deleteMany_({
                $where: { id: { $in: [100000000] } },
            });

            console.log(result);
        });
    });

    it('delete user in transaction', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');    
            const User = db.entity('user');
            await User.create_({
                "email": "test2@wisley.ai",
                ":profile": {
                    "firstName": "思狸",
                    "lastName": "唯",
                    "dob": "2000-01-01",
                    "gender": "male"
                },
                "password": "test",
                "isEmailVerified": true,
                "status": "active",       
                "isDeleted": false       
            }, { $upsert: true, $bypassReadOnly: new Set([ 'isDeleted' ]) });

            const { data: users } = await User.findMany_({});

            const result = await db.transaction_(async (_db) => {
                const retDelete = await _db.entity('user').deleteOne_({
                    $where: { id: users[0].id },
                    $getDeleted: true,
                });
                if (1 !== retDelete['affectedRows']) {
                    throw new DatabaseError();
                }
                if (retDelete?.data?.profile) {
                    const retDeleteProfile = await _db.entity('personProfile').deleteOne_({
                        $where: {
                            id: retDelete.data.profile,
                        },
                    });
                    if (1 !== retDeleteProfile['affectedRows']) {
                        throw new DatabaseError();
                    }
                }    
            });            
        });
    });
});
