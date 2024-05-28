const testSuite = require("@genx/test");
const runner = require("../src/runner");

const jobs = require('./genx-run.jobs.json');

testSuite(
    __filename,
    function (suite) {
        suite.testCase("test1", async function () {
            await runner(jobs, null, {
                variables: { $env:{ var1: "Hello", var2: "Gen-X" } }
            });
        });
    },
    { verbose: true }
);
