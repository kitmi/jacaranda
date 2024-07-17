import { unflattenObject, _, eachAsync_ } from '@kitmi/utils';
import Excel from 'exceljs';

export const writeExcelTemplate_ = async (templateFile, columnsMeta, config) => {
    const keys = Object.keys(columnsMeta);

    let workbook = new Excel.Workbook();

    const sheet = workbook.addWorksheet('Template');

    // add header
    sheet.addRow(keys);
    // eslint-disable-next-line no-new-array
    const rowPlaceHolders = new Array(keys.length);

    const templatedRows = config.rows || 50;

    for (let j = 0; j < templatedRows; j++) {
        // add en empty rows
        sheet.addRow(rowPlaceHolders);

        for (let i = 1; i <= keys.length; i++) {
            const colKey = keys[i - 1];
            const metadata = columnsMeta[colKey];
            const cell = sheet.getCell(j + 2, i);

            if (metadata) {
                if (metadata.enum) {
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: [`"${metadata.enum.join(',')}"`],
                    };
                } else if (metadata.type === 'currency') {
                    cell.alignment = { horizontal: 'right' };
                    if (metadata.format && config[metadata.format]) {
                        cell.numFmt = config[metadata.format];
                    }
                } else if (metadata.type === 'percentage') {
                    if (metadata.format && config[metadata.format]) {
                        cell.numFmt = config[metadata.format];
                    } else {
                        cell.numFmt = '0.00%';
                    }
                } else if (metadata.type === 'datetime') {
                    cell.dataValidation = {
                        type: 'date',
                        showErrorMessage: true,
                        formulae: [new Date()],
                    };

                    if (metadata.format && config[metadata.format]) {
                        cell.numFmt = config[metadata.format];
                    } else {
                        cell.numFmt = 'yyyy/mm/dd';
                    }
                } else if (metadata.type === 'text') {
                    if (metadata.format && config[metadata.format]) {
                        cell.numFmt = config[metadata.format];
                    } else {
                        cell.numFmt = '@';
                    }
                }
            }
        }
    }

    sheet.addRow(rowPlaceHolders);

    for (let i = 1; i <= keys.length; i++) {
        const cell = sheet.getCell(templatedRows + 2, i);
        cell.border = { top: { style: 'thin' } };
    }

    await workbook.xlsx.writeFile(templateFile);
};

export const loadExcelFile_ = async (db, mainEntity, dataFile, reverseMapping, payloadFunctor, needConfirm) => {
    let workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(dataFile);

    const data = [];

    workbook.eachSheet((worksheet) => {
        let colKeys;

        worksheet.eachRow(function (row, rowNumber) {
            if (!colKeys) {
                colKeys = _.drop(row.values).map((key) => reverseMapping[key]);
            } else {
                const rowValues = _.drop(row.values);
                const isNonEmpty = _.find(rowValues, (val) => val != null && val.toString().trim() !== '');

                if (!isNonEmpty) {
                    return;
                }

                const record = _.fromPairs(_.zip(colKeys, rowValues));

                if (!_.isEmpty(record)) {
                    const _record = unflattenObject(record);

                    data.push({
                        rowNumber,
                        record: _record,
                        primaryValue: rowValues[0],
                    });
                }
            }
        });
    });

    const errors = [];
    const confirmations = [];
    const rowsResult = [];

    const pushError = (err, rowNumber) => {
        errors.push({
            rowNumber,
            error: err.message,
            ...(err.info ? { info: _.pick(err.info, ['entity', 'value', 'error']) } : null),
        });
    };

    const Entity = db.entity(mainEntity);
    const processed = [];
    await eachAsync_(data, async ({ rowNumber, record, primaryValue }) => {
        try {
            const _confirm = [];
            record = await payloadFunctor(Entity, record, rowNumber, _confirm);

            if (_confirm.length > 0) {
                _confirm.forEach((msg) => confirmations.push({ rowNumber, message: msg }));
            }

            processed.push({ rowNumber, record, primaryValue });
            await Entity.create_(record, { $dryRun: true });
        } catch (error) {
            if (error.info?.errors) {
                error.info?.errors.forEach((err) => pushError(err, rowNumber));
            } else {
                pushError(error, rowNumber)
            }
        }
    });

    if (errors.length > 0) {
        return { errors };
    }

    if (needConfirm) {
        return { rows: processed, confirmations };
    }

    await eachAsync_(processed, async ({ rowNumber, record, primaryValue }) => {
        try {
            const result = await Entity.create_(record);
            rowsResult.push({
                rowNumber,
                [Entity.meta.keyField]: result.data[Entity.meta.keyField],
                primaryValue,
            });
        } catch (error) {
            errors.push({
                rowNumber,
                error: error.message,
            });
        }
    });

    return { result: rowsResult, errors };
};
