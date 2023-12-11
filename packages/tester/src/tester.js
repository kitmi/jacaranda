import { _, batchAsync_, Box, fxargs } from '@kitmi/utils';
import { fs } from '@kitmi/sys';
import path from 'node:path';
import testShouldThrow_ from '@kitmi/utils/testShouldThrow_';
import dbgGetCallerFile from '@kitmi/utils/dbgGetCallerFile';
import WebServer, { startWorker, HttpClient } from '@kitmi/jacaranda';
import Benchmark from 'benchmark';
import _superagent from 'superagent';
import { superagent } from '@kitmi/adapters';

import createAuth from './createAuth';
import readTestData from './readTestData'

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

const [jacatProxy, _setJacat] = Box();

export const jacat = jacatProxy;
export const setJacat = _setJacat;

/**
 * Jacaranda tester.
 * @class Tester
 */
class JacaTester {
    /**
     * Test if an async function throws an error
     * @function Tester.throw_
     * @param {Function} fn - Function (async) that should throw an error
     * @param {*} error
     */
    throw_ = testShouldThrow_;

    constructor(config) {
        this.config = config;
        this.startedServers = {};
    }

    /**
     * Load fixtures and declare test case with `it`.
     * @function Tester.loadFixtures
     * @param {Function} [testCase] - Test case to run after loading fixtures. async (data) => {}
     */
    loadFixtures(testCase) {
        let fixturePath = this.config.fixturePath || './test/fixtures';
        const fixtureType = this.config.fixtureType || 'json';

        const callerFileName = dbgGetCallerFile();        
        const baseName = path.basename(callerFileName, '.spec.js');
        const testCaseDir = path.resolve(fixturePath, baseName);

        if (!fs.existsSync(testCaseDir)) {
            throw new Error('Fixture path not exist: ' + testCaseDir);
        }

        const files = fs.readdirSync(testCaseDir);
        files.forEach((fixtureFile) => {            
            const fixtureFilePath = path.join(testCaseDir, fixtureFile);
            const testCaseName = path.basename(fixtureFilePath, '.' + fixtureType);
            const testCaseData = readTestData(fixtureFilePath, fixtureType);
            
            it(testCaseName, async () => {
                jacat.param('fixturePath', fixtureFilePath);
                jacat.param('data', testCaseData);

                await testCase(testCaseData);
            });
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
     */
    async step_(name, fn) {
        if (allure) {
            await allure.step(name, fn);
        }
    }

    /**
     * Record a parameter in a test case report.
     * @param {String} name - Name of the parameter.
     * @param {*} value - Value of the parameter.
     */
    param(name, value) {
        if (allure) {
            const { content, type } = serialize(value);
            allure.parameter(name, content, type);
        }
    }

    /**
     * Attach an object in a test case report.
     * @param {String} name - Name of the attachment.
     * @param {*} value - Value of the attachment.
     */
    attach(name, value) {
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
     */
    async startServer_(...args) {
        let [name, options] = fxargs(args, ['string?', 'object?']);

        if (name && this.startedServers[name]) {
            return this.startedServers[name];
        }

        const serverOptions = name ? this.config.servers?.[name] : null;

        if (!serverOptions) {
            throw new Error(`Server options for "${name}" not found.`);
        }

        const server = new WebServer(name, { ...serverOptions, ...options });
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
     */
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

    /**
     * Stop all running servers.
     * @async
     */
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
     * @param {String} [name] - Name of the worker to start.
     * @param {function} testToRun - Test (async) function to run.
     * @param {*} [options] - Options for starting the worker.
     * @async
     */
    async startWorker_(...args) {
        let [name, testToRun, options] = fxargs(args, ['string?', 'function', 'object?']);

        const workerOptions = name ? this.config.workers?.[name] : null;

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
                ...workerOptions,
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
     * @param {String|WebServer} server
     * @param {String|Function} [authenticator]
     * @param {Function} testToRun
     * @param {*} options
     * @returns
     */
    async withClient_(...args) {
        let [server, authenticator, testToRun, options] = fxargs(args, [
            'string|object?',
            'string?',
            'function',
            'object?',
        ]);

        if (typeof server !== 'object') {
            server = await this.startServer_(server);
        }

        const authConfig = authenticator ? this.config.authentications?.[authenticator] : null;
        authenticator &&= createAuth(authenticator /** authticationKey */, authConfig ?? {});

        const client = new HttpClient(superagent(_superagent), { endpoint: server.host, ...options });

        client.onResponse = (result, req, res) => {
            this.attach(`${req.method} ${req.url}`, { headers: res.header, response: result });
        };

        authenticator && (await authenticator(client));

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

export default JacaTester;
