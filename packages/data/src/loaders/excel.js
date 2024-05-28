const { unflattenObject, _, eachAsync_ } = require('@genx/july');

module.exports = {
    writeTemplate_: async (templateFile, columnsMeta, config) => {
        const keys = Object.keys(columnsMeta);

        const Excel = require('exceljs');
        let workbook = new Excel.Workbook();

        const sheet = workbook.addWorksheet('Template');

        // add header
        sheet.addRow(keys);
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
                    if (metadata.type === 'enum') {
                        cell.dataValidation = {
                            type: 'list',
                            allowBlank: true,
                            formulae: [`"${metadata.values.join(',')}"`],
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
                            formulae: [new Date()]
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
    },

    load_: async (
        db,
        mainEntity,
        dataFile,
        reverseMapping,
        payloadFunctor,
        needConfirm
    ) => {
        const Excel = require('exceljs');
        let workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(dataFile);

        const data = [];

        workbook.eachSheet((worksheet) => {
            let colKeys;

            worksheet.eachRow(function (row, rowNumber) {
                if (!colKeys) {
                    colKeys = _.drop(row.values).map(
                        (key) => reverseMapping[key]
                    );
                } else {
                    const rowValues = _.drop(row.values);
                    const isNonEmpty = _.find(
                        rowValues,
                        (val) => val != null && val.toString().trim() !== ''
                    );

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

        const Entity = db.model(mainEntity);
        const processed = [];
        await eachAsync_(data, async ({ rowNumber, record, primaryValue }) => {
            try {
                const _confirm = [];
                record = await payloadFunctor(
                    Entity,
                    record,
                    rowNumber,
                    _confirm
                );
                //console.dir(record, { depth: 10 });

                if (_confirm.length > 0) {
                    _confirm.forEach((c) =>
                        confirmations.push({ rowNumber, ...c })
                    );
                }

                processed.push({ rowNumber, record, primaryValue });
                await Entity.create_(record, { $dryRun: true });
            } catch (error) {
                errors.push({
                    rowNumber,
                    error: error.message,
                    ...(error.info ? { info: error.info } : null),
                });
            }
        });

        if (errors.length > 0) {
            return { errors };
        }

        if (needConfirm && confirmations.length > 0) {
            return { confirmations };
        }

        await eachAsync_(
            processed,
            async ({ rowNumber, record, primaryValue }) => {
                try {
                    const result = await Entity.create_(record);
                    rowsResult.push({
                        rowNumber,
                        [Entity.meta.keyField]: result[Entity.meta.keyField],
                        primaryValue,
                    });
                } catch (error) {
                    errors.push({
                        rowNumber,
                        error: error.message,
                    });
                }
            }
        );

        return { result: rowsResult, errors };
    },
};
