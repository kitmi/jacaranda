import { writeExcelTemplate_, loadExcelFile_ } from '../src';
import { fs } from '@kitmi/sys';

const dataFileWithErrors = './test/files/data-errors-1-line.xlsx';

const mappingColumns = {
    '书名': 'name',
    '描述': 'desc',
    '数值字段': 'numValue',
    '日期字段': 'date',
    '枚举字段': 'type',
    '百分比字段(%)': 'percentage',
};

describe('excel loaderr', function () {
    before(async () => {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            await Book.deleteAll_({ $physical: true });

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('load data with errors', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { errors } = await loadExcelFile_(
                db,
                'book',
                dataFileWithErrors,
                mappingColumns,
                async (Entity, record, rowNumber, confirmations) => {
                    // 如果有需要用户确认的信息，就push到confirmations数组
                    return record;
                }
            );

            console.log(errors);
        });
    });
});
