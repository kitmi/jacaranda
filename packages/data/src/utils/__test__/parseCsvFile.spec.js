'use strict';

const path = require('path');
const parseCsvFile = require('../parseCsvFile');

const csvFile = path.resolve(__dirname, '../../../test/files/australia.csv');

describe('unit:parseCsvFile', function () {    
    it('parse csv', async function () {
        let result = await parseCsvFile(csvFile);
        result.length.should.be.exactly(70);
        result[69].ticker.should.be.equal('BTCA');
    });

    it('parse csv with transform stream', async function () {
        let result = [];

        await parseCsvFile(csvFile, null, async (record, line) => {
            result.push({ id: line, ...record });
        });
        result.length.should.be.exactly(70);
        result[69].ticker.should.be.equal('BTCA');
        result[69].id.should.be.exactly(69);
    });
});