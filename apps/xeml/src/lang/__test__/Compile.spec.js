'use strict';

const path = require('path');
const GemlParser = require('../grammar/xeml');
const fs = require('fs');

const SOURCE_PATH = path.resolve(__dirname, '../../../test/data/unit/grammar');

describe.only('unit:lang:Grammar', function () {    
    
    it('compile product schema', function () {
        const gemlFile = path.join(SOURCE_PATH, 'ihom.geml');
        const geml = GemlParser.parse(fs.readFileSync(gemlFile, "utf8"));
        console.log(geml);     
    });
});