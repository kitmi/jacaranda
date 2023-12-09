import { Types } from '../src/allAsync';
import shouldThrow_ from '@kitmi/utils/testShouldThrow_';

describe('all async', function () {
    it('bvt', async function () {
        await shouldThrow_(
            async () =>
                Types.OBJECT.sanitize_({ a: 1 }, { schema: { a: { type: 'number', mod: [['~jsv', { $gt: 2 }]] } } }),
            '"a" must be greater than 2.'
        );
    });

    it('bvt - zh-CN', async function () {
        await shouldThrow_(
            async () =>
                Types.OBJECT.sanitize_(
                    { a: 1 },
                    { schema: { a: { type: 'number', mod: [['~jsv', { $gt: 2 }]] } } },
                    { locale: 'zh-CN' }
                ),
            '"a" 的数值必须大于 2。'
        );
    });
});
