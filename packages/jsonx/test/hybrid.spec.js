import config from '../src/config';
import enUS from '@kitmi/jsonv/locale/en-US';
import Jxs from '../src';

config.loadMessages('en-US', enUS).setLocale('en-US');

describe('Jxs:hybrid', function () {
    it('eval', function () {
        let obj = {
            key1: 2000,
            key11: 2000,
            key12: 2000,
            key13: 2000,
        };

        let jxso = new Jxs(obj);

        const pipelined = jxso.evaluate([
            {
                '|>$add': 100,
            },
            {
                '|>$subtract': 200,
            },
            '$sum',
        ]).value;

        pipelined.should.be.exactly(7600);

        jxso = new Jxs(obj);
        jxso.evaluate({
            key1: {
                $add: 100,
            },
            key11: {
                $subtract: 100,
            },
            key12: {
                $multiply: 100,
            },
            key13: {
                $divide: 100,
            },
        }).value.should.be.eql({
            key1: 2100,
            key11: 1900,
            key12: 200000,
            key13: 20,
        });

        jxso.evaluate([
            '$sum',
            {
                $add: 1,
            },
        ]).value.should.be.exactly(204021);
    });

    it('eval array', function () {
        let obj = {
            keep: 'keep',
            items: [
                { name: 'Jack', score: 60 },
                { name: 'Bob', score: 40 },
                { name: 'Jane', score: 80 },
                { name: 'Peter', score: 100 },
            ],
            ignored: 'ingored',
            exlcluded: 'exlcluded',
        };

        let jxso = new Jxs(obj);

        const pipelined = jxso.evaluate({
            keep: true,
            excluded: false,
            newItem: { $set: 'new' },
            highestScore: [
                '$$PARENT.items',
                {
                    $sortBy: 'score',
                },
                '$reverse',
                {
                    $nth: 0,
                },
                {
                    $valueOf: 'score',
                },
            ],
        }).value;

        should.exist(pipelined.keep);
        should.exist(pipelined.newItem);
        should.exist(pipelined.highestScore);
        should.not.exist(pipelined.exlcluded);
        should.not.exist(pipelined.items);
        should.not.exist(pipelined.ignored);

        pipelined.newItem.should.be.exactly('new');
        pipelined.highestScore.should.be.exactly(100);
    });

    it('transform collection', function () {
        let array = [
            {
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'user': 101,
                'agency': 1,
                ':user': { email: 'email2', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'user': 102,
                'agency': 1,
                ':user': { email: 'email3', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'user': 103,
                'agency': 2,
                ':user': { email: 'email4', other: 'any' },
                ':agency': { name: 'agency2', other: 'any' },
            },
            {
                'user': 104,
                'agency': 2,
                ':user': { email: 'email5', other: 'any' },
                ':agency': { name: 'agency2', other: 'any' },
            },
        ];

        let transformed = Jxs.evaluate(array, {
            '|>$apply': {
                user: ['$$PARENT.:user', { $pick: ['email'] }],
                agency: ['$$PARENT.:agency', { $pick: ['name'] }],
            },
        });

        transformed.should.be.eql([
            { user: { email: 'email1' }, agency: { name: 'agency1' } },
            { user: { email: 'email2' }, agency: { name: 'agency1' } },
            { user: { email: 'email3' }, agency: { name: 'agency1' } },
            { user: { email: 'email4' }, agency: { name: 'agency2' } },
            { user: { email: 'email5' }, agency: { name: 'agency2' } },
        ]);
    });

    it('additem', function () {
        let array = [1];

        should.throws(() => {
            let transformed = Jxs.evaluate(array, {
                '|>$apply': [
                    {
                        $addItem: ['$test', '$$CURRENT.id'],
                    },
                ],
            });
        }, 'The value to take a "addItem" operator must be either an object or an array.');
    });

    it('filter', function () {
        let array = [
            {
                'id': 1,
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'id': 2,
                'user': 101,
                'agency': 1,
                ':user': { email: 'email2', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'id': 3,
                'user': 102,
                'agency': 1,
                ':user': { email: 'email3', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
            {
                'id': 4,
                'user': 103,
                'agency': 2,
                ':user': { email: 'email4', other: 'any' },
                ':agency': { name: 'agency2', other: 'any' },
            },
            {
                'id': 5,
                'user': 104,
                'agency': 2,
                ':user': { email: 'email5', other: 'any' },
                ':agency': { name: 'agency2', other: 'any' },
            },
        ];

        let transformed = Jxs.evaluate(array, [
            {
                $select: {
                    user: {
                        $gte: 102,
                    },
                },
            },
            {
                '|>$omit': {
                    $startWith: ':',
                },
            },
        ]);

        transformed.should.be.eql([
            { id: 3, user: 102, agency: 1 },
            { id: 4, user: 103, agency: 2 },
            { id: 5, user: 104, agency: 2 },
        ]);
    });

    it('pick', function () {
        let array = null;

        let picked_left = Jxs.evaluate(array, {
            '|>$apply': [
                {
                    $pick: {
                        $not: {
                            $startWith: 'u',
                        },
                    },
                },
            ],
        });

        let array1 = [
            {
                'user': 100,
                'agency': 1,
                ':user': { email: 'email1', other: 'any' },
                ':agency': { name: 'agency1', other: 'any' },
            },
        ];
        picked_left.should.be.eql({});
        let picked_right = Jxs.evaluate(array1, {
            '|>$apply': [
                {
                    $pick: 1,
                },
            ],
        });
        picked_left.should.be.eql({});
    });

    it('assign', function () {
        let obj = {
            'id': 1,
            'user': 100,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        };

        let transformed = Jxs.evaluate(obj, [
            {
                $assign: {
                    user: { $expr: { $add: 200 } },
                },
            },
        ]);

        transformed.should.be.eql({
            'id': 1,
            'user': 300,
            'agency': 1,
            ':user': { email: 'email1', other: 'any' },
            ':agency': { name: 'agency1', other: 'any' },
        });
    });
});
