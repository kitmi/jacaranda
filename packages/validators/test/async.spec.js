import SYS, { Types } from '../src/allAsync';
import zh from '@kitmi/jsonv/locale/zh';
import shouldThrow_ from '@kitmi/utils/testShouldThrow_';

SYS.jsvConfig.loadMessages('zh-CN', zh);

describe('all async', function () {
    it('bvt', async function () {
        await shouldThrow_(
            async () =>
                Types.OBJECT.sanitize_({ a: 1 }, { schema: { a: { type: 'number', post: [['~jsv', { $gt: 2 }]] } } }),
            '"a" must be greater than 2.'
        );
    });

    it('bvt - zh-CN', async function () {
        SYS.jsvConfig.setLocale('zh-CN');

        await shouldThrow_(
            async () =>
                Types.OBJECT.sanitize_(
                    { a: 1 },
                    { schema: { a: { type: 'number', post: [['~jsv', { $gt: 2 }]] } } },
                    { locale: 'zh-CN' }
                ),
            '"a" 的数值必须大于 2。'
        );
    });
});
