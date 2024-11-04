import SYS, { Types } from '../src/allSync';
import shouldThrow_ from '@kitmi/utils/testShouldThrow_';

describe('real cases', function () {
    const schema1 = {
        schema: {
            type: {
                type: 'text',
                enum: ['password', 'token'],
            },
            username: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            password: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            token: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [
                    ['~maxLength', 200],
                    [
                        '~jsv',
                        {
                            $required: {
                                $expr: ['$parent.type', { $is: 'token' }],
                            },
                        },
                    ],
                ],
            },
        },
        post: [
            [
                '~jsv',
                {
                    $if: [
                        {
                            $expr: ['$this.type', { $is: 'password' }],
                        },
                        {
                            username: { $required: true },
                            password: { $required: true },
                        },
                    ],
                },
            ],
        ],
    };

    const schema2 = {
        schema: {
            type: { type: 'text', enum: ['password', 'token'] },
            username: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            password: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            token: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [
                    ['~maxLength', 200],
                    [
                        '~jsv',
                        {
                            $required: { $expr: ['$parent.type', { $is: 'token' }] },
                        },
                    ],
                ],
            },
        },
        post: [
            [
                '~jsv',
                {
                    $if: [
                        { $expr: ['$this.type', { $is: 'password' }] },
                        {
                            $expr: [
                                '$this',
                                {
                                    $pick: {
                                        keys: ['username', 'password'],
                                        reserveEmptyEntry: true,
                                    },
                                },
                                { $should: { '|>$value': { $required: true } } },
                            ],
                        },
                    ],
                },
            ],
        ],
    };

    const schema3 = {
        schema: {
            type: { type: 'text', enum: ['password', 'token'] },
            username: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            password: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [['~maxLength', 200]],
            },
            token: {
                type: 'text',
                emptyAsNull: true,
                optional: true,
                post: [
                    ['~maxLength', 200],
                    [
                        '~jsv',
                        {
                            $required: { $expr: ['$parent.type', { $is: 'token' }] },
                        },
                    ],
                ],
            },
        },
        post: [
            [
                '>jsx',
                {
                    $if: [
                        ['$this.type', { $is: 'password' }],
                        {
                            $sanitize: {
                                $expr: {
                                    $set: {
                                        type: 'object',
                                        schema: {
                                            username: {
                                                $expr: [
                                                    '$payload.schema.username',
                                                    { $assign: { optional: undefined } },
                                                ],
                                            },
                                            password: {
                                                $expr: [
                                                    '$payload.schema.password',
                                                    { $assign: { optional: undefined } },
                                                ],
                                            },
                                        },
                                        keepUnsanitized: true,
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        ],
    };

    beforeEach(() => {
        SYS.jsvConfig.setLocale('en');
    });

    it('schema1-case-1', async function () {
        await shouldThrow_(
            () => {
                Types.OBJECT.sanitize(
                    {
                        type: 'token',
                        username: 'xxxxx',
                        password: 'xxxxx',
                    },
                    schema1
                );
            },
            'Post-process validation failed.',
            { info: { token: '"token" is required.' } }
        );
    });

    it('schema1-case-2', async function () {
        await shouldThrow_(
            () => {
                Types.OBJECT.sanitize(
                    {
                        type: 'password',
                        token: 'xxxxx',
                    },
                    schema1
                );
            },
            'Post-process validation failed.',
            { info: { username: '"username" is required.' } }
        );
    });

    it('schema1-case-3', function () {
        const result = Types.OBJECT.sanitize(
            {
                type: 'token',
                token: 'xxxxx',
            },
            schema1
        );

        result.should.eql({ type: 'token', token: 'xxxxx' });
    });

    it('schema1-case-4', function () {
        const result = Types.OBJECT.sanitize(
            {
                type: 'password',
                username: 'xxxxx',
                password: 'xxxxx',
            },
            schema1
        );

        result.should.eql({ type: 'password', username: 'xxxxx', password: 'xxxxx' });
    });

    it('schema2-case-1', async function () {
        await shouldThrow_(
            () => {
                Types.OBJECT.sanitize(
                    {
                        type: 'password',
                        token: 'xxxxx',
                    },
                    schema2
                );
            },
            'Post-process validation failed.',
            {
                info: {
                    _: 'Multiple errors occurred.',
                    username: '"username" is required.',
                    password: '"password" is required.',
                },
            }
        );
    });

    it('schema2-case-2', async function () {
        await shouldThrow_(
            () => {
                Types.OBJECT.sanitize(
                    {
                        type: 'token',
                        username: 'xxxxx',
                        password: 'xxxxx',
                    },
                    schema2
                );
            },
            'Post-process validation failed.',
            { info: { token: '"token" is required.' } }
        );
    });

    it('schema2-case-3', function () {
        const result = Types.OBJECT.sanitize(
            {
                type: 'password',
                username: 'xxxxx',
                password: 'xxxxx',
            },
            schema2
        );

        result.should.eql({ type: 'password', username: 'xxxxx', password: 'xxxxx' });
    });

    it('schema3-case-1', function () {
        const result = Types.OBJECT.sanitize(
            {
                type: 'password',
                username: 'xxxxx',
                password: 'xxxxx',
            },
            schema3
        );

        result.should.eql({ type: 'password', username: 'xxxxx', password: 'xxxxx' });
    });

    it('schema3-case-2', function () {
        (() => {
            const result = Types.OBJECT.sanitize(
                {
                    type: 'password',
                    username: 'xxxxx',
                },
                schema3
            );
        }).should.Throw('Missing a required value.');
    });
});
