import path from 'node:path';
import fs from 'node:fs';
import { _, esmCheck } from '@kitmi/utils';

import JacaTester, { jacat, setJacat } from './tester';

let _initialized = false;
let _config = null;
let _asyncDump = null;

const bootstrap = () => {
    let configPath = path.resolve(process.cwd(), 'test.config.json');
    if (!fs.existsSync(configPath)) {
        configPath = path.resolve(process.cwd(), 'test/test.config.json');

        if (!fs.existsSync(configPath)) {
            throw new Error('Cannot find "test.config.json" in current directory or "./test".');
        }
    }

    _config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    processConfigSection(_config.only);
    processConfigSection(_config.skip);

    if (_config.enableAsyncDump) {
        _asyncDump = esmCheck(require('./asyncDump'));
    }

    const _jacat = new JacaTester(_config);
    setJacat(_jacat);

    global.jacat = _jacat;
};

const processConfigSection = (section) => {
    if (section) {
        configFileListToHashSet(section, 'files');
        if (section.suites) {
            section.suites = _.mapValues(section.suites, (value) => {
                if (Array.isArray(value)) {
                    return new Set(value);
                }
                return value;
            });
        }
    }
};

const configFileListToHashSet = (node, listKey) => {
    const list = node[listKey];
    if (list) {
        node[listKey] = new Set(list.map((file) => path.resolve(process.cwd(), file)));
    }
};

if (!_initialized) {
    _initialized = true;
    bootstrap();
}

export const mochaHooks = {
    beforeEach(done) {
        const testCaseTitle = this.currentTest.title;
        const testFile = this.currentTest.file;
        const testSuiteTitle = this.currentTest.parent.title;

        const _done = () => {
            // do something if needed
            done();
        };

        if (!_.isEmpty(_config.only)) {
            // only mode
            const { files, suites } = _config.only;

            // Check if the test file, suite, or case is in the config
            // If it is not, skip the test

            if (files && !files.has(testFile)) {
                this.skip();
                return done();
            }

            if (suites) {
                const suiteInfo = suites[testSuiteTitle];

                if (suiteInfo == null) {
                    this.skip();
                    return done();
                }

                if (suiteInfo === 'all') {
                    return _done();
                }

                if (!suiteInfo.has(testCaseTitle)) {
                    this.skip();
                    return done();
                }
            }
        } else if (!_.isEmpty(_config.skip)) {
            // skip mode
            const { files, suites } = _config.skip;

            // Check if the test file, suite, or case is in the config
            if (files && files.has(testFile)) {
                // If it is, skip the test
                this.skip();
                return done();
            }

            if (suites) {
                const suiteInfo = suites[testSuiteTitle];
                if (suiteInfo != null) {
                    if (suiteInfo === 'all') {
                        this.skip();
                        return done();
                    }

                    if (suiteInfo.has(testCaseTitle)) {
                        this.skip();
                        return done();
                    }
                }
            }
        }

        _done();
    },
};

export const mochaGlobalSetup = async function () {
    if (_config.enableAllure) {
        global.allure = esmCheck(require('allure-mocha/runtime')).allure;
    }
};

export const mochaGlobalTeardown = async function () {
    await jacat.closeAllServers_();

    if (_config.enableAsyncDump) {
        _asyncDump();
    }
};
