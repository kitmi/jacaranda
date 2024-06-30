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

            result.data.length.should.equal(1);
            result.data[0].id.should.equal(insertId);
            result.data[0].depth.should.equal(0);

            const { insertId: id2 } = await TagCategory.create_({
                name: 'tagCategory 2',
            });

            const result2 = await TagCategory.addChildNode_(insertId, id2);
            result2.affectedRows.should.equal(1);

            const { insertId: id3 } = await TagCategory.create_({
                name: 'tagCategory 3',
            });

            const result3 = await TagCategory.addChildNode_(id2, id3);
            result3.affectedRows.should.equal(2);

            const { insertId: id4 } = await TagCategory.create_({
                name: 'tagCategory 4',
            });

            const result4 = await TagCategory.addChildNode_(id3, id4);
            result4.affectedRows.should.equal(3);

            const result5 = await TagCategory.getAllDescendants_(insertId);

            result5.data.length.should.equal(4);
            result5.data[1].id.should.equal(id2);
            result5.data[1].depth.should.equal(1);
            result5.data[2].id.should.equal(id3);
            result5.data[2].depth.should.equal(2);
            result5.data[3].id.should.equal(id4);
            result5.data[3].depth.should.equal(3);

            const { insertId: id5 } = await TagCategory.create_({
                name: 'tagCategory 5',
            });

            const { insertId: id6 } = await TagCategory.create_({
                name: 'tagCategory 6',
            });

            const result7 = await TagCategory.addChildNode_(id5, id6);
            result7.affectedRows.should.equal(1);

            await TagCategory.deleteOne_({
                id: id2,
                $physical: true,
            });

            const TagCategoryTree = db.entity('tagCategoryTree');
            const result6 = await TagCategoryTree.findMany_({});
            result6.data.length.should.equal(7);

            const result8 = await TagCategory.getTopNodes_();
            result8.data.length.should.equal(3);

            const result9 = await TagCategory.findMany_({});
            result9.data.length.should.equal(5);

            await TagCategory.addChildNode_(insertId, id3);
            const result10 = await TagCategory.getTopNodes_();
            result10.data.length.should.equal(2);

            await TagCategory.moveNode_(insertId, id4);
            const result11 = await TagCategory.getAllDescendants_(insertId);
            result11.data.length.should.equal(3);
            result11.data[1].id.should.equal(id3);
            result11.data[1].depth.should.equal(1);
            result11.data[2].id.should.equal(id4);
            result11.data[2].depth.should.equal(1);
        });
    });
});
