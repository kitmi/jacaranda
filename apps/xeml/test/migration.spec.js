const path = require('node:path');
const Linker = require('../src/lang/Linker');
const { cmd, fs } = require('@kitmi/sys');

describe.only('test-migration', function () {
    after(() => {
        // copy ./test/xeml/test.xeml.ver1 to ./test/xeml/test.xeml
        fs.copyFileSync('./test/xeml/test.xeml.ver1', './test/xeml/test.xeml');
        fs.unlinkSync('./test/xeml/test.xeml.ver1');
    });

    it('test case 1', async function () {
        await jacat.startWorker_(async (app) => {
            let exitCode = await cmd.runLive_('node', './bin/xeml.js build -w ./test -c ./conf/xeml.default.yaml');
            exitCode.should.equal(0);
            await cmd.runLive_('node', './bin/xeml.js migrate -w ./test -c ./conf/xeml.default.yaml --reset');

            // copy ./test/xeml/test.xeml to ./test/xeml/test.xeml.ver1
            await fs.copyFile('./test/xeml/test.xeml', './test/xeml/test.xeml.ver1');
            // copy ./test/xeml/test.xeml.ver2 to ./test/xeml/test.xeml
            await fs.copyFile('./test/xeml/test.xeml.ver2', './test/xeml/test.xeml');

            exitCode = await cmd.runLive_('node', './bin/xeml.js migrate -w ./test -c ./conf/xeml.default.yaml');
            exitCode.should.not.equal(0);

            exitCode = await cmd.runLive_('node', './bin/xeml.js build -w ./test -c ./conf/xeml.default.yaml');
            exitCode.should.equal(0);

            exitCode = await cmd.runLive_(
                'node',
                './bin/xeml.js migrate -w ./test -c ./conf/xeml.default.yaml --verbose'
            );
            exitCode.should.equal(0);
        });
    });
});
