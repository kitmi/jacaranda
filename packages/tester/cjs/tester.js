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
    default: function() {
        return _default;
    },
    jacat: function() {
        return jacat;
    },
    setJacat: function() {
        return setJacat;
    }
});
const _utils = require("@kitmi/utils");
const _sys = require("@kitmi/sys");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _testShouldThrow_ = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/testShouldThrow_"));
const _dbgGetCallerFile = /*#__PURE__*/ _interop_require_default(require("@kitmi/utils/dbgGetCallerFile"));
const _jacaranda = /*#__PURE__*/ _interop_require_wildcard(require("@kitmi/jacaranda"));
const _benchmark = /*#__PURE__*/ _interop_require_default(require("benchmark"));
const _superagent = /*#__PURE__*/ _interop_require_default(require("superagent"));
const _adapters = require("@kitmi/adapters");
const _microtime = /*#__PURE__*/ _interop_require_default(require("microtime"));
const _createAuth = /*#__PURE__*/ _interop_require_default(require("./createAuth"));
const _readTestData = /*#__PURE__*/ _interop_require_default(require("./readTestData"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
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
function serialize(obj, replacer, space) {
    let content;
    let type;
    if (typeof obj === 'string') {
        content = obj;
        type = 'text/plain';
    } else {
        content = JSON.stringify(obj, replacer, space);
        type = 'application/json';
    }
    return {
        content,
        type
    };
}
const [jacatProxy, _setJacat] = (0, _utils.Box)();
const jacat = jacatProxy;
const setJacat = _setJacat;
/**
 * Jacaranda tester.
 * @class 
 */ class JacaTester {
    /**
     * Load fixtures and declare test case with `it`.     
     * @param {Function} [testCase] - Test case to run after loading fixtures. async (data) => {}
     */ loadFixtures(testCase) {
        let fixturePath = this.config.fixturePath || './test/fixtures';
        const fixtureType = this.config.fixtureType || 'json';
        const callerFileName = (0, _dbgGetCallerFile.default)();
        const baseName = _nodepath.default.basename(callerFileName, '.spec.js');
        const testCaseDir = _nodepath.default.resolve(fixturePath, baseName);
        if (!_sys.fs.existsSync(testCaseDir)) {
            throw new Error('Fixture path not exist: ' + testCaseDir);
        }
        const files = _sys.fs.readdirSync(testCaseDir);
        files.forEach((fixtureFile)=>{
            const fixtureFilePath = _nodepath.default.join(testCaseDir, fixtureFile);
            const testCaseName = _nodepath.default.basename(fixtureFilePath, '.' + fixtureType);
            const testCaseData = (0, _readTestData.default)(fixtureFilePath, fixtureType);
            it(testCaseName, async ()=>{
                jacat.param('fixturePath', fixtureFilePath);
                jacat.param('data', testCaseData);
                await testCase(testCaseData);
            });
        });
    }
    async profile_(name, fn) {
        const t1 = _microtime.default.now();
        await fn();
        const t2 = _microtime.default.now();
        const elapsed = t2 - t1;
        console.log(name, 'elapsed:', elapsed, 'ms');
        this.attach(`Profiling result - ${name}`, {
            elapsed
        });
    }
    // ------------------------------
    // allure
    // ------------------------------
    /**
     * Mark a step of a test case.
     * @param {String} name - Name of the step.
     * @param {Function} fn - Function to run.
     * @async
     */ async step_(name, fn) {
        if (allure) {
            await allure.step(name, fn);
        }
    }
    /**
     * Record a parameter in a test case report.
     * @param {String} name - Name of the parameter.
     * @param {*} value - Value of the parameter.
     */ param(name, value) {
        if (allure) {
            const { content, type } = serialize(value);
            allure.parameter(name, content, type);
        }
    }
    /**
     * Attach an object in a test case report.
     * @param {String} name - Name of the attachment.
     * @param {*} value - Value of the attachment.
     */ attach(name, value) {
        if (allure) {
            const { content, type } = serialize(value, null, 4);
            allure.attachment(name, content, type);
        }
    }
    // ------------------------------
    // server
    // ------------------------------
    /**
     * Start a server for code coverage testing.
     * @param  {String} [name] - Name of the server to start, should be configured in test config.
     * @param  {Object} [options]
     * @async
     */ async startServer_(...args) {
        let [name, options] = (0, _utils.fxargs)(args, [
            'string?',
            'object?'
        ]);
        if (name && this.startedServers[name]) {
            return this.startedServers[name];
        }
        const serverOptions = name ? this.config.servers?.[name] : null;
        if (!serverOptions) {
            throw new Error(`Server options for "${name}" not found.`);
        }
        const server = new _jacaranda.default(name, {
            ...serverOptions,
            ...options
        });
        await server.start_();
        if (name) {
            this.startedServers[name] = server;
        }
        return server;
    }
    /**
     * Stop a running server.
     * @param {WebServer} server
     * @async
     */ async stopServer_(server) {
        if (typeof server === 'string') {
            server = this.startedServers[server];
        }
        if (server == null) {
            return;
        }
        await server.stop_();
        delete this.startedServers[server.name];
    }
    /**
     * Stop all running servers.
     * @async
     */ async closeAllServers_() {
        await (0, _utils.batchAsync_)(Object.values(this.startedServers), async (server)=>{
            await server.stop_();
        });
        this.startedServers = {};
    }
    // ------------------------------
    // worker
    // ------------------------------
    /**
     * Start a worker app for testing
     * @param {String} [name] - Name of the worker to start.
     * @param {function} testToRun - Test (async) function to run.
     * @param {*} [options] - Options for starting the worker.
     * @async
     */ async startWorker_(...args) {
        let [name, testToRun, options] = (0, _utils.fxargs)(args, [
            'string?',
            'function',
            'object?'
        ]);
        const workerOptions = name ? this.config.workers?.[name] : null;
        let err;
        const result = await (0, _jacaranda.startWorker)(async (app)=>{
            try {
                return await testToRun(app);
            } catch (e) {
                console.error(e);
                err = e;
            }
        }, {
            ...workerOptions,
            ...options
        });
        if (err) {
            throw err;
        }
        return result;
    }
    // ------------------------------
    // httpClient
    // ------------------------------
    /**
     * Create a http client for testing.
     * @param {String|WebServer} server
     * @param {String|Function} [authenticator]
     * @param {Function} testToRun
     * @param {*} options
     * @async
     */ async withClient_(...args) {
        let [server, authenticator, testToRun, options] = (0, _utils.fxargs)(args, [
            'string|object?',
            'string?',
            'function',
            'object?'
        ]);
        if (typeof server !== 'object') {
            server = await this.startServer_(server);
        }
        const authConfig = authenticator ? this.config.authentications?.[authenticator] : null;
        authenticator &&= (0, _createAuth.default)(authenticator /** authticationKey */ , authConfig ?? {});
        const client = new _jacaranda.HttpClient((0, _adapters.superagent)(_superagent.default), {
            endpoint: server.host,
            ...options
        });
        client.onResponse = (result, req, res)=>{
            this.attach(`${req.method} ${req.url}`, {
                headers: res.header,
                response: result
            });
        };
        authenticator && await authenticator(client);
        await testToRun(client, server);
    }
    // ------------------------------
    // benchmark
    // ------------------------------
    /**
     * Run benchmark against given methods.
     * @param {*} mapOfMethods - Map of name to function with payload
     * @param {*} verifier - Function to verify the result of each method
     * @param {*} payload
     */ async benchmark_(mapOfMethods, verifier, payload) {
        const suite = new _benchmark.default.Suite();
        _utils._.each(mapOfMethods, (f, name)=>{
            verifier(f(payload));
            suite.add(name, function() {
                f(payload);
            });
        });
        return new Promise((resolve, reject)=>{
            const self = this;
            suite.on('cycle', function(event) {
                const cycleMessage = String(event.target);
                console.log(cycleMessage);
                self.attach('cycle', cycleMessage);
            }).on('complete', function() {
                const completeMessage = 'The fastest is ' + this.filter('fastest').map('name');
                self.attach('complete', completeMessage);
                resolve();
            }).on('error', (event)=>reject(String(event.target))).run({
                async: true
            });
        });
    }
    constructor(config){
        /**
     * Test if an async function throws an error     
     * @param {Function} fn - Function (async) that should throw an error
     * @param {*} error
     */ _define_property(this, "throw_", _testShouldThrow_.default);
        this.config = config;
        this.startedServers = {};
    }
}
const _default = JacaTester;

//# sourceMappingURL=tester.js.map