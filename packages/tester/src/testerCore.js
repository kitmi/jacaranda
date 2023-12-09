import { _, esmCheck, toBoolean, batchAsync_ } from '@kitmi/utils';
import { startWorker, HttpClient } from '@kitmi/jacaranda';
import Benchmark from 'benchmark';
import path from "node:path";
import loadFixtures from './loadFixtures';

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

    return { content, type };
}

class GxTester {
    loadFixtures = loadFixtures;

    constructor(config) {
        this.config = config;
        this.startedServers = {};
        this.isCoverMode = process.env.COVER && toBoolean(process.env.COVER);
    }

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

    // specially for server code coverage test with supertest agent
    async startServer_(name) {        
        if (this.startedServers[name]) {
            return this.startedServers[name];
        }

        const { servers } = this.config;
        const serverEntry = servers?.[name];

        if (!serverEntry) {
            throw new Error(`Server entry for "${name}" not found`);
        }

        const _serverInfo = typeof serverEntry === 'string' ? { entry: serverEntry } : serverEntry;

        const createServer = esmCheck(require(path.resolve(process.cwd(), _serverInfo.entry)));

        const server = await createServer(name, _serverInfo.options);
        await server.start_();

        this.startedServers[name] = server;
        return server;
    }

    async stopServer_(server) {
        if (typeof server === 'string') {
            server = this.startedServers[server];
        }

        await server.stop_();

        delete this.startedServers[server.name];
    }

    async closeAllServers_() {
        await batchAsync_(Object.values(this.startedServers), async (server) => {
            await server.stop_();
        });
        this.startedServers = {};
    }

    // ------------------------------
    // worker
    // ------------------------------

    /**
     * Start a worker app for testing
     * @param {function} testToRun - Test (async) function to run.
     * @param {*} options - Options passed to the test worker, see startWorker of @kitmi/jacaranda.
     * @async
     */
    async startWorker_(testToRun, options) {
        let err;

        const result = await startWorker(
            async (app) => {
                try {
                    return await testToRun(app);
                } catch (e) {
                    console.error(e);
                    err = e;
                }
            },
            {
                workerName: 'tester',
                configName: 'test',
                configPath: 'test/conf',
                ignoreUncaught: true,
                exitOnUncaught: false,
                ...this.config.workerOptions,
                ...options,
            }
        );

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
     * @param {*} server
     * @param {*} [authenticator]
     * @param {*} testToRun
     * @param {*} options
     * @returns
     */
    async withHttpClient_(server, authenticator, testToRun, options) {
        if (typeof options === 'undefined') {
            if (typeof testToRun === 'undefined') {
                testToRun = authenticator;
                authenticator = null;
            } else if (typeof testToRun === 'object') {
                options = testToRun;
                testToRun = authenticator;
                authenticator = null;
            }
        }

        const { worker: workerOptions, client: clientOptions } = options || {};
        if (typeof server === 'string') {
            server = await this.startServer_(server);
        }

        return this.startWorker_(async (app) => {
            if (typeof authenticator === 'string') {
                authenticator = defaultUserAuth(authenticator /** authticationKey */);
            }

            const { authentication: authConfig } = this.config;

            const getHttpClient_ = async () => {
                let agentClientSetting =
                    this.config.httpAgent?.[this.isCoverMode ? 'coverage' : 'normal'];

                if (typeof agentClientSetting === 'string') {
                    agentClientSetting = { adapter: agentClientSetting };
                } else if (Array.isArray(agentClientSetting)) {
                    agentClientSetting = { adapter: agentClientSetting[0], options: agentClientSetting[1] };
                }
                    
                const agentCreatorModule = agentClientSetting?.adapter ?? (this.isCoverMode ? 'supertest' : 'superagent');
                const agentCreator = esmCheck(require(`@kitmi/adapters/${agentCreatorModule}`));

                const agent = agentCreator();
                if (this.isCoverMode) {                    
                    agent.server = server.httpServer;
                }

                const client = new HttpClient(agent, {  ...agentClientSetting.options , ...clientOptions });                

                client.onResponse = (result, req, res) => {
                    this.attach(`${req.method} ${req.url}`, { headers: res.header, response: result });
                };

                if (!authenticator) {
                    delete client.onSending;
                    return client;
                }

                await authenticator(client, authConfig);

                return client;
            }

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
     */
    async benchmark_(mapOfMethods, verifier, payload) {
        const suite = new Benchmark.Suite();

        _.each(mapOfMethods, (f, name) => {
            verifier(f(payload));

            suite.add(name, function () {
                f(payload);
            });
        });

        return new Promise((resolve, reject) => {
            const self = this;

            suite
                .on('cycle', function (event) {
                    const cycleMessage = String(event.target);
                    console.log(cycleMessage);
                    self.attach('cycle', cycleMessage);
                })
                .on('complete', function () {
                    const completeMessage = 'The fastest is ' + this.filter('fastest').map('name');
                    self.attach('complete', completeMessage);
                    resolve();
                })
                .on('error', (event) => reject(String(event.target)))
                .run({ async: true });
        });
    }
}

export default GxTester;
