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

            // root1
            const {
                op,
                data,
                affectedRows,
                insertId: root1,
            } = await TagCategory.create_({
                name: 'root 1',
            });

            const result = await TagCategory.getAllDescendants_(root1);

            result.data.length.should.equal(1);
            result.data[0].id.should.equal(root1);
            result.data[0].depth.should.equal(0);

            const { insertId: id2 } = await TagCategory.create_({
                name: 'node 2',
            });

            const result2 = await TagCategory.addChildNode_(root1, id2);
            result2.affectedRows.should.equal(1);

            const { insertId: id3 } = await TagCategory.create_({
                name: 'node 3',
            });

            const result3 = await TagCategory.addChildNode_(id2, id3);
            result3.affectedRows.should.equal(2);

            const { insertId: id4 } = await TagCategory.create_({
                name: 'node 4',
            });

            const result4 = await TagCategory.addChildNode_(id3, id4);
            result4.affectedRows.should.equal(3);

            const result5 = await TagCategory.getAllDescendants_(root1);

            result5.data.length.should.equal(4);
            result5.data[1].id.should.equal(id2);
            result5.data[1].depth.should.equal(1);
            result5.data[2].id.should.equal(id3);
            result5.data[2].depth.should.equal(2);
            result5.data[3].id.should.equal(id4);
            result5.data[3].depth.should.equal(3);

            // root1 -> id2 -> id3 -> id4

            // root2
            const { insertId: id5 } = await TagCategory.create_({
                name: 'root 2',
            });

            const { insertId: id6 } = await TagCategory.create_({
                name: 'node 6',
            });

            const result7 = await TagCategory.addChildNode_(id5, id6);
            result7.affectedRows.should.equal(1);

            // root2 -> id5 -> id6

            await TagCategory.deleteOne_({
                id: id2,
                $physical: true,
            });

            const TagCategoryTree = db.entity('tagCategoryTree');
            const result6 = await TagCategoryTree.findMany_({});
            result6.data.length.should.equal(7);

            // root1, id3, root2
            const result8 = await TagCategory.getTopNodes_();
            result8.data.length.should.equal(3);

            // root1, id3, root2, id6, id4
            const result9 = await TagCategory.findMany_({});
            result9.data.length.should.equal(5);

            await TagCategory.addChildNode_(root1, id3);
            const result10 = await TagCategory.getTopNodes_();
            result10.data.length.should.equal(2);

            const { data: tree } = await TagCategoryTree.findMany_({});
            console.log({
                root1,
                id3,
                id4,
                tree,
            });

            // root1 -> id3 -> id4
            await TagCategory.moveNode_(root1, id4);
            // root1 -> id3
            // root1 -> id4

            const result11 = await TagCategory.getAllDescendants_(root1);

            result11.data.length.should.equal(3);
            result11.data[1].id.should.equal(id3);
            result11.data[1].depth.should.equal(1);
            result11.data[2].id.should.equal(id4);
            result11.data[2].depth.should.equal(1);
        });
    });

    it('clone subtree', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const TagCategory = db.entity('tagCategory');

            // root1
            const {
                op,
                data,
                affectedRows,
                insertId: root1,
            } = await TagCategory.create_({
                name: 'root 1',
            });

            const result = await TagCategory.getAllDescendants_(root1);

            result.data.length.should.equal(1);
            result.data[0].id.should.equal(root1);
            result.data[0].depth.should.equal(0);

            const { insertId: id2 } = await TagCategory.create_({
                name: 'node 2',
            });

            const result2 = await TagCategory.addChildNode_(root1, id2);
            result2.affectedRows.should.equal(1);

            const { insertId: id3 } = await TagCategory.create_({
                name: 'node 3',
            });

            const result3 = await TagCategory.addChildNode_(id2, id3);
            result3.affectedRows.should.equal(2);

            const { insertId: id4 } = await TagCategory.create_({
                name: 'node 4',
            });

            const result4 = await TagCategory.addChildNode_(id3, id4);
            result4.affectedRows.should.equal(3);

            const result5 = await TagCategory.getAllDescendants_(root1);

            result5.data.length.should.equal(4);
            result5.data[1].id.should.equal(id2);
            result5.data[1].depth.should.equal(1);
            result5.data[2].id.should.equal(id3);
            result5.data[2].depth.should.equal(2);
            result5.data[3].id.should.equal(id4);
            result5.data[3].depth.should.equal(3);

            // root1 -> id2 -> id3 -> id4

            await TagCategory.cloneSubTreeToNode_(root1, id2);

            // root1 -> id2 -> id3 -> id4
            //       -> id5 -> id6 -> id7
            const result6 = await TagCategory.getAllDescendants_(root1);
            result6.data.length.should.equal(7);
            result6.data[0].id.should.equal(root1);
            result6.data[1].id.should.equal(id2);
            result6.data[1].depth.should.equal(1);
            result6.data[2].depth.should.equal(1);
            result6.data[2].name.should.equal(result6.data[1].name);
            result6.data[3].depth.should.equal(2);
            result6.data[4].depth.should.equal(2);
            result6.data[4].name.should.equal(result6.data[3].name);
            result6.data[5].depth.should.equal(3);
            result6.data[6].depth.should.equal(3);
            result6.data[6].name.should.equal(result6.data[5].name);
        });
    });

    it('directed graph', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const TagCategory = db.entity('tagCategory');

            // root1
            const { insertId: root1 } = await TagCategory.create_({
                name: 'root 1',
            });

            const { insertId: id2 } = await TagCategory.create_({
                name: 'node 2',
            });

            await TagCategory.addChildNode_(root1, id2);

            const { insertId: id3 } = await TagCategory.create_({
                name: 'node 3',
            });

            await TagCategory.addChildNode_(id2, id3);

            await TagCategory.addChildNode_(root1, id3);
            // root1 -> id2 -> id3
            //       -> id3

            const { data } = await TagCategory.getAllDescendants_(root1);

            const parentsOfId3 = await TagCategory.getParentsId_(id3);
            parentsOfId3.sort().should.be.eql([root1, id2]);

            const childrenOfRoot1 = await TagCategory.getChildrenId_(root1);
            childrenOfRoot1.sort().should.be.eql([id2, id3]);

            const childrenOfRoot2 = await TagCategory.getChildrenId_(id2);
            childrenOfRoot2.should.be.eql([id3]);
        });
    });
});
