import SYS, { Types } from '../src/allSync';
import zh from '@kitmi/jsonv/locale/zh';
import shouldThrow_ from '@kitmi/utils/testShouldThrow_';

SYS.jsvConfig.loadMessages('zh-CN', zh);

describe('all sync', function () {
    it('bvt', async function () {
        SYS.jsvConfig.setLocale('en');

        await shouldThrow_(
            () => Types.OBJECT.sanitize({ a: 1 }, { schema: { a: { type: 'number', post: [['~jsv', { $gt: 2 }]] } } }),
            'Post-process validation failed.',
            { info: { a: '"a" must be greater than 2.' } }
        );
    });

    it('bvt - zh-CN', async function () {
        SYS.jsvConfig.setLocale('zh-CN');

        await shouldThrow_(
            () => Types.OBJECT.sanitize({ a: 1 }, { schema: { a: { type: 'number', post: [['~jsv', { $gt: 2 }]] } } }),
            'Post-process validation failed.',
            { info: { a: '"a" 的数值必须大于 2。' } }
        );
    });

    const meta = {
        schema: {
            // key1 field's value should be an integer within the range from 10 to 30
            key1: {
                type: 'integer',
                post: [
                    ['~max', 30],
                    ['~min', 10],
                ],
            },
            // key2 field's value should be an integer within the range from 20 to 30
            key2: {
                type: 'integer',
                post: [
                    ['~max', 20],
                    ['~min', 10],
                ],
            },
        },
        optional: true,
        post: [
            {
                // the object as a whole should match the jsonv expression below, ~jsv === ~jsonv
                name: '~jsv',
                options: {
                    key1: {
                        $gt: { $expr: '$root.key2' }, // or $$ROOT.key2
                    },
                },
            },
            [
                // after passing the validation above, the object will be transformed by the below jsonx expression, >jsx === >jsonx
                '>jsx',
                {
                    // transform from object to an array
                    $toArray: { name: '$$KEY', value: '$$CURRENT' },
                },
            ],
            // finally, there is default activator to ensure the object has a default value if it is null
            '=default',
        ],
    };

    it('sample 1', function () {
        const obj1 = Types.OBJECT.sanitize({ key1: 20, key2: 15 }, meta);
        obj1.should.eql([
            { name: 'key1', value: 20 },
            { name: 'key2', value: 15 },
        ]);
    });

    it('sample 2', async function () {
        SYS.jsvConfig.setLocale('en');

        await shouldThrow_(
            () => Types.OBJECT.sanitize({ key1: 15, key2: 20 }, meta),
            'Post-process validation failed.',
            { info: { key1: '"key1" must be greater than [$root.key2].' } }
        );
    });

    it('sample 3', async function () {
        await shouldThrow_(() => Types.OBJECT.sanitize(null, meta), 'Post-process validation failed.', {
            info: { key1: '"key1" must be greater than [$root.key2].' },
        });
    });

    it('type', function () {
        const obj1 = Types.OBJECT.sanitize(
            { key: 20 },
            {
                schema: {
                    key: { type: 'integer', post: ['>typeOf'] },
                },
            }
        );
        obj1.should.be.eql({ key: 'integer' });
    });
});
