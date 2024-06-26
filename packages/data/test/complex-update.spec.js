import { xrExpr, xrCol } from "../src";

describe('crud complex', function () {
    it('complex update', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            const { op, data, affectedRows, insertId } = await Product.create_({
                'type': 'good',
                'name': 'Demo Product 2',
                'desc': 'Demo Product Description 2',
                'image': 'https://example.com/demo.jpg',
                'thumbnail': 'https://example.com/demo-thumb.jpg',
                'free': true,
                'openToGuest': true,
                'isPackage': false,
                'hasVariants': false,
                'category': 2,
                ':assets': [
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset.jpg',
                        },
                    },
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset2.jpg',
                        },
                    },
                    {
                        'tag': 'poster',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-poster.jpg',
                        },
                    },
                ],
                ':attributes': [
                    {
                        type: 'dimension',
                        value: '10x10x10',
                    },
                    {
                        type: 'origin',
                        value: 'China',
                    },
                ],
                ':variants': [
                    {
                        type: 'color',
                        value: 'red',
                    },
                    {
                        type: 'color',
                        value: 'blue',
                    },
                    {
                        type: 'color',
                        value: 'green',
                    },
                    {
                        type: 'size',
                        value: 'L',
                    },
                    {
                        type: 'size',
                        value: 'M',
                    },
                    {
                        type: 'size',
                        value: 'S',
                    },
                ],
            });           

            const existing = await Product.findOne_({
                id: insertId,
                $select: ['*'],
                $relation: ['assets.resource'],
            });

            await Product.updateOne_(
                {
                    name: 'Demo Product 200',
                    ':assets': {
                        $delete: [
                            existing[':assets'][0],
                            existing[':assets'][1]
                        ],
                        $update: [
                            { ...Product.getRalatedEntity('assets').omitReadOnly(existing[':assets'][2]), tag: 'poster2' }
                        ],
                        $create: [
                            {
                                'tag': 'poster',
                                ':resource': {
                                    mediaType: 'image',
                                    url: 'https://example.com/demo-poster2.jpg',
                                },
                            }
                        ]
                    }                    
                },
                { $where: { id: insertId }, $getUpdated: true }
            );

            const updated = await Product.findOne_({
                id: insertId,
                $select: ['*'],
                $relation: ['assets.resource'],
            });

            updated.name.should.equal('Demo Product 200');
            updated[':assets'].length.should.equal(2);
            updated[':assets'][0].tag.should.equal('poster2');
            updated[':assets'][0][':resource'].url.should.equal('https://example.com/demo-poster.jpg');
            updated[':assets'][1].tag.should.equal('poster');
            updated[':assets'][1][':resource'].url.should.equal('https://example.com/demo-poster2.jpg');
        });
    });

    it('update many', async function () {
        await tester.start_(async (app) => {
            const db = app.db('test2');
            const Product = db.entity('product');
            const { insertId: id1 } = await Product.create_({
                'type': 'good',
                'name': 'Demo Product 2',
                'desc': 'Demo Product Description 2',
                'image': 'https://example.com/demo.jpg',
                'thumbnail': 'https://example.com/demo-thumb.jpg',
                'free': true,
                'openToGuest': true,
                'isPackage': false,
                'hasVariants': false,
                'category': 2,
                ':assets': [
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset.jpg',
                        },
                    },
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset2.jpg',
                        },
                    },
                    {
                        'tag': 'poster',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-poster.jpg',
                        },
                    },
                ],
                ':attributes': [
                    {
                        type: 'dimension',
                        value: '10x10x10',
                    },
                    {
                        type: 'origin',
                        value: 'China',
                    },
                ],
                ':variants': [
                    {
                        type: 'color',
                        value: 'red',
                    },
                    {
                        type: 'color',
                        value: 'blue',
                    },
                    {
                        type: 'color',
                        value: 'green',
                    },
                    {
                        type: 'size',
                        value: 'L',
                    },
                    {
                        type: 'size',
                        value: 'M',
                    },
                    {
                        type: 'size',
                        value: 'S',
                    },
                ],
            });      
            
            const { insertId: id2 } = await Product.create_({
                'type': 'good',
                'name': 'Demo Product 2',
                'desc': 'Demo Product Description 2',
                'image': 'https://example.com/demo.jpg',
                'thumbnail': 'https://example.com/demo-thumb.jpg',
                'free': true,
                'openToGuest': true,
                'isPackage': false,
                'hasVariants': false,
                'category': 2,
                ':assets': [
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset.jpg',
                        },
                    },
                    {
                        'tag': 'snapshots',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-asset2.jpg',
                        },
                    },
                    {
                        'tag': 'poster',
                        ':resource': {
                            mediaType: 'image',
                            url: 'https://example.com/demo-poster.jpg',
                        },
                    },
                ],
                ':attributes': [
                    {
                        type: 'dimension',
                        value: '10x10x10',
                    },
                    {
                        type: 'origin',
                        value: 'China',
                    },
                ],
                ':variants': [
                    {
                        type: 'color',
                        value: 'red',
                    },
                    {
                        type: 'color',
                        value: 'blue',
                    },
                    {
                        type: 'color',
                        value: 'green',
                    },
                    {
                        type: 'size',
                        value: 'L',
                    },
                    {
                        type: 'size',
                        value: 'M',
                    },
                    {
                        type: 'size',
                        value: 'S',
                    },
                ],
            });    

            const result = await Product.updateMany_(
                {
                    name:  xrExpr(xrExpr(xrCol('name'), "||", " "), "||", xrCol('id'))
                    // name || " " || id                
                },
                { $where: { id: { $in: [id1, id2] } }, $getUpdated: true }
            );

            result.data.length.should.equal(2);
            result.data[0].name.should.equal('Demo Product 2 ' + id1);
            result.data[1].name.should.equal('Demo Product 2 ' + id2);
        });
    });
});
