describe('closureTable', function () {
    before(async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const TagCategory = db.entity('tagCategory');
            await TagCategory.deleteAll_({ $physical: true });
        });
    });

    it('auto insert decendents', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const TagCategory = db.entity('tagCategory');
            const { op, data, affectedRows, insertId } = await TagCategory.create_({
                name: 'tagCategory 1',
            });

            const result = await TagCategory.getAllDescendants_(insertId);
            console.dir(result.data, { depth: 10 });

            const { insertId: id2 } = await TagCategory.create_({
                name: 'tagCategory 2',
            });

            const result2 = await TagCategory.addChildNode_(insertId, id2);
            console.dir(result2, { depth: 10 });
        });
    });
});
