"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    mochaGlobalSetup: function() {
        return mochaGlobalSetup;
    },
    mochaGlobalTeardown: function() {
        return mochaGlobalTeardown;
    },
    mochaHooks: function() {
        return mochaHooks;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
const _utils = require("@kitmi/utils");
const _testerCore = /*#__PURE__*/ _interop_require_default(require("./testerCore"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let _initialized = false;
let _config = null;
let _asyncDump = null;
const bootstrap = ()=>{
    let configPath = _nodepath.default.resolve(process.cwd(), 'test.config.json');
    if (!_nodefs.default.existsSync(configPath)) {
        configPath = _nodepath.default.resolve(process.cwd(), 'test/test.config.json');
        if (!_nodefs.default.existsSync(configPath)) {
            throw new Error('Cannot find "test.config.json" in current directory or "./test".');
        }
    }
    _config = JSON.parse(_nodefs.default.readFileSync(configPath, 'utf8'));
    processConfigSection(_config.only);
    processConfigSection(_config.skip);
    if (_config.enableAsyncDump) {
        _asyncDump = (0, _utils.esmCheck)(require('./asyncDump'));
    }
    global.gxt = new _testerCore.default(_config);
};
const processConfigSection = (section)=>{
    if (section) {
        configFileListToHashSet(section, 'files');
        if (section.suites) {
            section.suites = _utils._.mapValues(section.suites, (value)=>{
                if (Array.isArray(value)) {
                    return new Set(value);
                }
                return value;
            });
        }
    }
};
const configFileListToHashSet = (node, listKey)=>{
    const list = node[listKey];
    if (list) {
        node[listKey] = new Set(list.map((file)=>_nodepath.default.resolve(process.cwd(), file)));
    }
};
if (!_initialized) {
    _initialized = true;
    bootstrap();
}
const mochaHooks = {
    beforeEach (done) {
        const testCaseTitle = this.currentTest.title;
        const testFile = this.currentTest.file;
        const testSuiteTitle = this.currentTest.parent.title;
        const _done = ()=>{
            // do something if needed
            done();
        };
        if (!_utils._.isEmpty(_config.only)) {
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
        } else if (!_utils._.isEmpty(_config.skip)) {
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
    }
};
const mochaGlobalSetup = async function() {
    if (_config.enableAllure) {
        global.allure = (0, _utils.esmCheck)(require('allure-mocha/runtime')).allure;
    }
    if (process.env.COVER) {
        const { servers } = _config;
        servers && await (0, _utils.batchAsync_)(Object.keys(servers), async (serverName)=>{
            await gxt.startServer_(serverName);
        });
    }
};
const mochaGlobalTeardown = async function() {
    await gxt.closeAllServers_();
    if (_config.enableAsyncDump) {
        _asyncDump();
    }
};

//# sourceMappingURL=bootstrap.js.map