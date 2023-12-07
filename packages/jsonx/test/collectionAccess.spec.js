import Jxs from '../src';

describe('jsx:keys/values/entries', function () {
    it('keys', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, '$keys');
        //console.log(transformed)
        transformed.should.be.eql(['id', 'user', 'agency', ':user', ':agency']);
    });

    it('values', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, '$values');
        //console.log(transformed)
        transformed.should.be.eql([1, 100, 1, { email: 'email1', other: 'any' }, { name: 'agency1', other: 'any' }]);
    });

    it('array:keys', function () {
        let array = [1, 2, 3];

        let transformed = Jxs.evaluate(array, '$keys');
        //console.log(transformed)
        transformed.should.be.eql(['0', '1', '2']);
    });

    it('array:values', function () {
        let array = [1, 2, 3];

        let transformed = Jxs.evaluate(array, '$values');
        //console.log(transformed)
        transformed.should.be.eql([1, 2, 3]);
    });

    it('entries', function () {
        let obj = {
            'id': 1,
            ':user': { email: 'email1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, '$entries');
        //console.log(transformed)
        transformed.should.be.eql([
            ['id', 1],
            [':user', { email: 'email1', other: 'any' }],
        ]);
    });

    it('filterNull', function () {
        let obj = {
            'id': 1,
            'user': null,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, '$filterNull');
        //console.log(transformed)
        transformed.should.be.eql({
            'id': 1,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });

    it('pick', function () {
        let obj = {
            'id': 1,
            'user': null,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $pick: ['id', 'agency'] });
        //console.log(transformed)
        transformed.should.be.eql({
            id: 1,
            agency: 1,
        });
    });

    it('omit', function () {
        let obj = {
            'id': 1,
            'user': null,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, { $omit: ['id', 'agency'] });
        //console.log(transformed)
        transformed.should.be.eql({
            'user': null,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });

    it('slice', function () {
        let array = [1, 2, 3, 4, 5];

        let transformed = Jxs.evaluate(array, { $slice: [1, 3] });
        //console.log(transformed)
        transformed.should.be.eql([2, 3]);

        transformed = Jxs.evaluate(array, { $slice: [0, 1] });
        //console.log(transformed)
        transformed.should.be.eql([1]);

        transformed = Jxs.evaluate(array, { $slice: [3] });
        //console.log(transformed)
        transformed.should.be.eql([4, 5]);

        transformed = Jxs.evaluate(null, { $slice: [3] });
        //console.log(transformed)
        should.not.exist(transformed);
    });

    it('group', function () {
        let array = [
            { id: 1, name: 'name1', group: 'group1' },
            { id: 2, name: 'name2', group: 'group1' },
            { id: 3, name: 'name3', group: 'group2' },
            { id: 4, name: 'name4', group: 'group2' },
            { id: 5, name: 'name5', group: 'group3' },
        ];

        let transformed = Jxs.evaluate(array, { $group: 'group' });
        //console.log(transformed)
        transformed.should.be.eql({
            group1: [
                { id: 1, name: 'name1', group: 'group1' },
                { id: 2, name: 'name2', group: 'group1' },
            ],
            group2: [
                { id: 3, name: 'name3', group: 'group2' },
                { id: 4, name: 'name4', group: 'group2' },
            ],
            group3: [{ id: 5, name: 'name5', group: 'group3' }],
        });
    });

    it('sort', function () {
        let array = [
            { id: 2, name: 'name2', group: 'group1' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 3, name: 'name3', group: 'group3' },
        ];

        let transformed = Jxs.evaluate(array, { $sort: 'id' });

        transformed.should.be.eql([
            { id: 1, name: 'name1', group: 'group2' },
            { id: 2, name: 'name2', group: 'group1' },
            { id: 3, name: 'name3', group: 'group3' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 5, name: 'name5', group: 'group2' },
        ]);

        transformed = Jxs.evaluate(array, { $sort: ['group', 'name'] });
        transformed.should.be.eql([
            { id: 2, name: 'name2', group: 'group1' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 3, name: 'name3', group: 'group3' },
        ]);
    });

    it('reverse', function () {
        let array = [
            { id: 2, name: 'name2', group: 'group1' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 3, name: 'name3', group: 'group3' },
        ];

        let transformed = Jxs.evaluate(array, '$reverse');

        transformed.should.be.eql([
            { id: 3, name: 'name3', group: 'group3' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 2, name: 'name2', group: 'group1' },
        ]);
    });

    it('findIndex', function () {
        let array = [
            { id: 2, name: 'name2', group: 'group1' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 3, name: 'name3', group: 'group3' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 3, name: 'name3', group: 'group3' },
        ];

        let transformed = Jxs.evaluate(array, { $findIndex: { id: 4 } });

        transformed.should.be.eql(1);

        transformed = Jxs.evaluate(array, { $findIndex: [{ id: 3 }, 3] });

        transformed.should.be.eql(5);
    });

    it('find', function () {
        let array = [
            { id: 2, name: 'name2', group: 'group1' },
            { id: 4, name: 'name4', group: 'group1' },
            { id: 3, name: 'name3', group: 'group3' },
            { id: 5, name: 'name5', group: 'group2' },
            { id: 1, name: 'name1', group: 'group2' },
            { id: 3, name: 'name6', group: 'group3' },
        ];

        let transformed = Jxs.evaluate(array, { $find: { id: 4 } });

        transformed.should.be.eql({ id: 4, name: 'name4', group: 'group1' });

        transformed = Jxs.evaluate(array, { $find: [{ id: 3 }, 3] });

        transformed.should.be.eql({ id: 3, name: 'name6', group: 'group3' });
    });

    it('find from object', function () {
        let object = {
            key1: 100,
            key2: 200,
            key3: { any: 1 }
        };

        let transformed = Jxs.evaluate(object, { $find: { $typeOf: 'object' } });

        transformed.should.be.eql({ any: 1 });

        transformed = Jxs.evaluate(object, { $find: [ { $gt: 50 }, 1 ] });

        transformed.should.be.eql(200);
    });
});
