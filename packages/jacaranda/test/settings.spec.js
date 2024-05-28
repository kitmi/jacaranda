import path from 'node:path';
import { fs } from '@kitmi/sys';
import { CliApp as App } from '../src';

const WORKING_DIR = path.resolve(__dirname, './temp');

describe('feature:settings', function () {
    let cliApp;

    before(async function () {
        fs.emptyDirSync(WORKING_DIR);

        cliApp = new App('test server', {
            workingPath: WORKING_DIR,
            //logLevel: 'verbose'
        });

        cliApp.once('configLoaded', () => {
            cliApp.config = {
                settings: {
                    'key': 1,
                    'env:development': {
                        key: 2,
                    },
                },
            };
        });

        return cliApp.start_();
    });

    after(async function () {
        await cliApp.stop_();
        fs.removeSync(WORKING_DIR);
    });

    it('unittest:settings env', function () {
        cliApp.settings.key.should.be.exactly(2);
    });
});
