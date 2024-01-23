import Jsx from '../src';

describe('jsx:merge', function () {
    it('merge - array', function () {
        let array = [1, 2, 3];
        let transformed = Jsx.evaluate(array, {
            $merge: ['$size', '$sum'],
        });

        transformed.should.be.eql([3, 6]);
    });

    it('merge - obj', function () {
        let obj = {
            key1: 10,
            key2: 'value2',
        };
        let transformed = Jsx.evaluate(obj, {
            $merge: [
                {
                    key1: {
                        $add: 10,
                    },
                },
                {
                    $create: {
                        key3: [
                            '$this.key2',
                            {
                                $concat: 'concat',
                            },
                        ],
                    },
                },
            ],
        });

        transformed.should.be.eql({
            key1: 20,
            key3: 'value2concat',
        });
    });

    it('transform collection - merge', function () {
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

        let transformed = Jsx.evaluate(array, {
            '|>$apply': {
                $merge: [
                    {
                        $pick: {
                            $not: {
                                $startWith: ':',
                            },
                        },
                    },
                    {
                        '@user': ['$$PARENT.:user', { $pick: ['email'] }],
                        '@agency': ['$$PARENT.:agency', { $pick: ['name'] }],
                    },
                ],
            },
        });

        transformed.should.be.eql([
            {
                'user': 100,
                'agency': 1,
                '@user': { email: 'email1' },
                '@agency': { name: 'agency1' },
            },
            {
                'user': 101,
                'agency': 1,
                '@user': { email: 'email2' },
                '@agency': { name: 'agency1' },
            },
            {
                'user': 102,
                'agency': 1,
                '@user': { email: 'email3' },
                '@agency': { name: 'agency1' },
            },
            {
                'user': 103,
                'agency': 2,
                '@user': { email: 'email4' },
                '@agency': { name: 'agency2' },
            },
            {
                'user': 104,
                'agency': 2,
                '@user': { email: 'email5' },
                '@agency': { name: 'agency2' },
            },
        ]);
    });
});
