const path = require('node:path');
const fs = require('node:fs');
const Xeml = require('../src/lang/grammar/xeml');
const XemlParser = Xeml.parser;

const file1 = path.resolve(__dirname, 'xeml', 'entities', 'resource.xeml');
const file2 = path.resolve(__dirname, 'xeml', 'entities', 'types.xeml');

describe('test-parser', function () {
    it('test case 1', function () {
        const result = XemlParser.parse(fs.readFileSync(file1, 'utf8'));
        fs.writeFileSync(file1 + '.json', JSON.stringify(result, null, 4));
        console.log(result);
    });

    it('test case 1', function () {
        const result = XemlParser.parse(fs.readFileSync(file2, 'utf8'));
        fs.writeFileSync(file2 + '.json', JSON.stringify(result, null, 4));
        console.log(result);
    });
});
