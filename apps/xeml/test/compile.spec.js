const path = require('node:path');
const Linker = require('../src/lang/Linker');

describe.only('test-parser', function () {
    it('test case 1', async function () {
        await jacat.startWorker_(async (app) => {
          const linker = new Linker(app, {
            schemaPath: path.resolve(__dirname, './schema'),
            useJsonSource: false,
            saveIntermediate: true,
            dependencies: {
              abc: '../abc-module'
            }
          });
          let result = linker.loadModule('testNamespace.xeml');
          console.log(result);

          result = linker.loadElement(result, 'modifier', 'module1:activator1', true);
          console.log(result.xemlModule);
        });
        
    });
});
