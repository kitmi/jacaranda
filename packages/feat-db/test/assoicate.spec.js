import { writeExcelTemplate_, loadExcelFile_ } from '../src';
import { fs } from '@kitmi/sys';

const dataFile = './test/files/data-associate.xlsx';

const mappingColumns = {
    '书名': 'name',
    '描述': 'desc',
    '书店': ':store.name',
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

    it('load data', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);

            const result2 = await loadExcelFile_(
                db,
                'book',
                dataFile,
                mappingColumns,
                async (Entity, record, rowNumber, confirmations) => {
                    // 如果有需要用户确认的信息，就push到confirmations数组
                    return record;
                }
            );

            if (result2.errors) {   
                console.error(result2.errors);
            }

            const result3 = await Book.findMany_({});
            result3.data.length.should.be.exactly(5);

            const Store = db.entity('store');
            const result4 = await Store.findMany_({});
            result4.data.length.should.be.exactly(4);
        });
    });
});
