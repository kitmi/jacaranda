const testSuite = require("@genx/test");
const runner = require("../src/runner");
const nil = require("../src/loggers/nil");

const jobs = require('./circular-deps.jobs.json');

testSuite(
    __filename,
    function (suite) {
        suite.testCase("test", async function () {
            let e;

            try {
                await runner(jobs, null, {
                    logger: nil,
                    variables: { $env:{ var1: "Hello", var2: "Gen-X" } }
                });
            } catch (_e) {
                e = _e;
            }

            should.exist(e);
            e.message.should.be.eql('Circular job dependency detected');            
        });
    },
    { verbose: true }
);
