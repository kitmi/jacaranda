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
const _jacaranda = /*#__PURE__*/ _interop_require_wildcard(require("@kitmi/jacaranda"));
const _benchmark = /*#__PURE__*/ _interop_require_default(require("benchmark"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _loadFixtures = /*#__PURE__*/ _interop_require_default(require("./loadFixtures"));
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
    // ------------------------------
    // allure
    // ------------------------------
    async step_(name, fn) {
        if (allure) {
            await allure.step(name, fn);
        }
    }
    param(name, value) {
        if (allure) {
            const { content, type } = serialize(value);
            allure.parameter(name, content, type);
        }
    }
    attach(name, value) {
        if (allure) {
            const { content, type } = serialize(value, null, 4);
            allure.attachment(name, content, type);
        }
    }
    // ------------------------------
    // server
    // ------------------------------
    // for server code coverage
    async startServer_(name) {
        if (name == null) {
            name = (0, _utils.keyAt)(this.config.servers);
            if (!name) {
                throw new Error('No server defined in config');
            }
        }
        if (this.startedServers[name]) {
            return;
        }
        const serverOptions = this.config.servers?.[name];
        if (!serverOptions) {
            throw new Error(`Server options for "${name}" not found`);
        }
        const server = new _jacaranda.default(name, serverOptions);
        await server.start_();
        this.startedServers[name] = server;
    }
    async stopServer_(server) {
        if (typeof server === 'string') {
            server = this.startedServers[server];
        }
        if (server == null) {
            return;
        }
        await server.stop_();
        delete this.startedServers[server.name];
    }
    async closeAllServers_() {
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
     * @async
     */ async startWorker_(name, testToRun) {
        if (name == null) {
            name = (0, _utils.keyAt)(this.config.servers);
            if (!name) {
                throw new Error('No server defined in config');
            }
        }
        let err;
        const result = await (0, _jacaranda.startWorker)(async (app)=>{
            try {
                return await testToRun(app);
            } catch (e) {
                console.error(e);
                err = e;
            }
        }, {
            workerName: 'tester',
            configName: 'test',
            configPath: 'test/conf',
            ignoreUncaught: true,
            exitOnUncaught: false,
            ...this.config.workerOptions,
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
     *
     * @param {String|WebServer} server
     * @param {String|Function} [authenticator]
     * @param {Function} testToRun
     * @param {*} options
     * @returns
     */ async withHttpClient_(server, authenticator, testToRun, options1) {
        if (typeof options1 === 'undefined') {
            if (typeof testToRun === 'undefined') {
                testToRun = authenticator;
                authenticator = null;
            } else if (typeof testToRun === 'object') {
                options1 = testToRun;
                testToRun = authenticator;
                authenticator = null;
            }
        }
        const { worker: workerOptions, client: clientOptions } = options1 || {};
        if (typeof server === 'string') {
            server = await this.startServer_(server);
        }
        return this.startWorker_(async (app)=>{
            if (typeof authenticator === 'string') {
                authenticator = defaultUserAuth(authenticator /** authticationKey */ );
            }
            const { authentication: authConfig } = this.config;
            const getHttpClient_ = async ()=>{
                let agentClientSetting = this.config.httpAgent?.[this.isCoverMode ? 'coverage' : 'normal'];
                if (typeof agentClientSetting === 'string') {
                    agentClientSetting = {
                        adapter: agentClientSetting
                    };
                } else if (Array.isArray(agentClientSetting)) {
                    agentClientSetting = {
                        adapter: agentClientSetting[0],
                        options: agentClientSetting[1]
                    };
                }
                const agentCreatorModule = agentClientSetting?.adapter ?? (this.isCoverMode ? 'supertest' : 'superagent');
                const agentCreator = (0, _utils.esmCheck)(require(`@kitmi/adapters/${agentCreatorModule}`));
                const agent = agentCreator();
                if (this.isCoverMode) {
                    agent.server = server.httpServer;
                }
                const client = new _jacaranda.HttpClient(agent, {
                    ...agentClientSetting.options,
                    ...clientOptions
                });
                client.onResponse = (result, req, res)=>{
                    this.attach(`${req.method} ${req.url}`, {
                        headers: res.header,
                        response: result
                    });
                };
                if (!authenticator) {
                    delete client.onSending;
                    return client;
                }
                await authenticator(client, authConfig);
                return client;
            };
            const client = await getHttpClient_();
            return testToRun(client, app);
        }, workerOptions);
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
     * Load fixtures and declare test case with `it`.
     * @function module:tester.loadFixtures
     * @param {Function} [testCase] - Test case to run after loading fixtures. (data) => {}
     */ _define_property(this, "loadFixtures", _loadFixtures.default);
        this.config = config;
        this.startedServers = {};
        this.isCoverMode = process.env.COVER && (0, _utils.toBoolean)(process.env.COVER);
    }
}
const _default = JacaTester;

//# sourceMappingURL=tester.js.map