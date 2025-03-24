## @kitmi/tester

## Unit Test Utility

`@kitmi/tester` is a JavaScript unit test utility with api code coverage, async dump for tracking async leak.

## Features

-   [x] Support coverage test of @kitmi/jacaranda applicaiton
-   [x] Support allure report
-   [x] Support async dump for debugging application hanging issue caused by pending async event
-   [x] Support @kitmi/jacaranda worker
-   [x] Support authencation protected api test
-   [x] Support JSON Validation Syntax
-   [x] Support configurable test case on/off switches
-   [x] Support profiling
-   [x] Support benchmark
-   [x] Support test step and progress record
-   Support job pipeline for long-run test

## Interface

gobal object `jacat`, or can also be imported by

```js
import { jacat } from '@kitmi/tester';
```

-   `startServer_(serverName?)`: start a server with options specified by serverName in the test config

-   `startWorker_(name?, async app => {/* test to run */}, options)`: start a worker

-   `withClient_(serverName?, authentication, async (client, server) => {/* test to run */}, options?)`: // start a worker and create a http client

-   `benchmark_(mapOfMethods, verifier, payload)`: // run benchmark againest several different implementions of the same purposes

-   `profile_(name, async () => { //test })`: // run profiling againest a test function

-   `step_(name, fn)`: // test step

-   `param(name, value)`: // record param used in a test into test report

-   `attach(name, value)`: // attach object produced during a test into test report

## Usage

### 1. add `.mocharc.js` to the project root

```js
require('@swc-node/register'); // for esmodule and commonjs hybid mode
require('@kitmi/utils/testRegister'); // adding should and expect dialects for chai

module.exports = {
    timeout: 300000,
    require: ['@kitmi/tester'], // for bootstrapping tester
    reporter: 'mocha-multi', // for combining console reporter and allure reporter
    reporterOptions: 'mocha-multi=test/mocha-multi-reporters.json', // as above
};
```

### 2. add `test/mocha-multi-reporters.json` config

```json
{
    "spec": {
        "stdout": "-",
        "options": {
            "verbose": true
        }
    },
    "allure-mocha": {
        "stdout": "-",
        "options": {
            "resultsDir": "./allure-results"
        }
    }
}
```

### 3. add `test/test.config.json` config

```json
{
    "skip": {
        "suites": {}
    },
    "enableAsyncDump": false,
    "enableAllure": true,
    "servers": {
        "server1": { // server options
            "configPath": "test/conf",
            "controllersPath": "test/actions",
            "sourcePath": "./",
            "logLevel": "info"
        },
        "server2": "src/server.js" // server entry file
    },
    "workers": {
        "tester": { // worker options
            "configName": "test",
            "configPath": "test/conf"
        },
        "test2": "src/test2.js" // worker entry file
    },
    "authentications": {
        "client1": {
            "loginType": "password",
            "accessType": "jwt",
            "loginOptions": {
                "endpoint": "/login",
                "username": "user",
                "password": "pass"
            }
        }
    }
}
```

### 4. write test cases

More examples refers to `test/*.spec.js`.

```js
describe('test1', function () {
    it('should pass1', function () {
        expect(true).to.be.true;
    });

    it('should pass2', function () {
        expect(true).to.be.true;
        jacat.attach('test2 result', {
            key: 'tesst',
            key2: 'tesst',
            key3: 'tesst',
        });
    });

    it('should pass async', async function () {
        await jacat.step_('step1', async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        expect(true).to.be.true;
    });
});
```

### 5. run test cases

```bash
mocha --recursive test/**/*.spec.js
```

### 6. generate test report

```bash
allure generate allure-results --clean -o allure-report && serve ./allure-report
```

### 7. run code coverage test and report

```bash
nyc --reporter=html --reporter=text mocha --recursive test/**/*.spec.js && open ./coverage/index.html
```

## API test

### Authentication

-   loginType
    -   password
-   accessType
    -   jwt
-   loginOptions:
    -

```json
{
    "authentications": {
        "client1": {
            "loginType": "password",
            "accessType": "jwt",
            "loginOptions": {
                "endpoint": "/login",
                "username": "user",
                "password": "pass"
            }
        }
    }
}
```

```js
it('/test/protected ok', async function () {
    await jacat.withClient_('server1', 'client1', async (client, server) => {
        const res = await client.get('/test/protected');
        expect(res).to.deep.equal({ status: 'ok' });
    });
});
```
