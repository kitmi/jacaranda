import { writeExcelTemplate_, loadExcelFile_ } from '../src';
import { fs } from '@kitmi/sys';

const bookType = ['friction', 'novel', 'bio', 'other'];

const columnsMeta = {
    '书名': { type: 'text', isRequired: true },
    '描述': { type: 'text' },
    '数值字段': { type: 'integer' },
    '日期字段': { type: 'datetime', format: 'dateFormat' },
    '枚举字段': { type: 'text', enum: bookType },
    '百分比字段(%)': { type: 'percentage', format: 'percentageFormat' },
};

const templateConfig = {
    currencyFormat: '"$"#,##0.00',
    percentageFormat: '0.00%',
    dateFormat: 'yyyy-mm-dd',
    rows: 20,
};

const templateFile = './test/output/template.xlsx';
const dataFile = './test/files/data.xlsx';
const dataFileWithErrors = './test/files/data-with-errors.xlsx';

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
        await fs.remove(templateFile);

        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');
            await Book.deleteAll_({ $physical: true });

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);
        });
    });

    it('write template', async function () {
        await tester.start_(async (app) => {
            await writeExcelTemplate_(templateFile, columnsMeta, templateConfig);
            fs.existsSync(templateFile).should.equal(true);
        });
    });

    it('load data', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const result = await Book.findMany_({});
            result.data.length.should.be.exactly(0);

            await loadExcelFile_(
                db,
                'book',
                dataFile,
                mappingColumns,
                async (Entity, record, rowNumber, confirmations) => {
                    // 如果有需要用户确认的信息，就push到confirmations数组
                    record.store = 1;
                    return record;
                }
            );

            const result2 = await Book.findMany_({});
            result2.data.length.should.be.exactly(7);
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
                    record.store = 1;
                    return record;
                }
            );

            errors[0].rowNumber.should.be.exactly(5);
            errors[0].error.should.be.eql('Invalid "type" value of "book" entity.');
            errors[1].rowNumber.should.be.exactly(6);
            errors[1].error.should.be.eql('Field "name" of "book" entity is required.');
        });
    });

    it('load data with confirmations', async function () {
        await tester.start_(async (app) => {
            const db = app.db();
            const Book = db.entity('book');

            const { confirmations } = await loadExcelFile_(
                db,
                'book',
                dataFile,
                mappingColumns,
                async (Entity, record, rowNumber, confirmations) => {
                    if (rowNumber === 6) {
                        confirmations.push('提示用户某个数据有问题，需要确认');
                    }
                    record.store = 1;
                    return record;
                },
                true /* need confirmation, don't forget */
            );

            confirmations[0].rowNumber.should.be.eql(6);
            confirmations[0].message.should.be.eql('提示用户某个数据有问题，需要确认');
        });
    });
});
