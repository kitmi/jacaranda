const path = require('node:path');
const Linker = require('../src/lang/Linker');

describe('test-parser', function () {
    it('test case 1', async function () {
        await jacat.startWorker_('tester', async (app) => {
            const linker = new Linker(app, {
                schemaPath: path.resolve(__dirname, './schema'),
                useJsonSource: false,
                saveIntermediate: false,
                dependencies: {
                    abc: '../abc-module',
                },
            });
            let result = linker.loadModule('testNamespace.xeml');

            result = linker.loadElement(result, 'Activator', 'module1:activator1', true);
            should.exist(result);
        });
    });
});
