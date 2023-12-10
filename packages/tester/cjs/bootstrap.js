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
const _tester = /*#__PURE__*/ _interop_require_wildcard(require("./tester"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
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
    const _jacat = new _tester.default(_config);
    (0, _tester.setJacat)(_jacat);
    global.jacat = _jacat;
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
};
const mochaGlobalTeardown = async function() {
    await _tester.jacat.closeAllServers_();
    if (_config.enableAsyncDump) {
        _asyncDump();
    }
};

//# sourceMappingURL=bootstrap.js.map