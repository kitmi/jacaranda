const testSuite = require("@genx/test");
const runner = require("../src/runner");
const nil = require("../src/loggers/nil");

const jobs = require('./pre-check.jobs.json');
const tasks = require('./tasks');

testSuite(
    __filename,
    function (suite) {
        suite.testCase("test1", async function () {
            const result = await runner(jobs, null, {
                logger: nil,
                tasks,
                variables: { $env:{ var3: '100' } }
            });
            
            result[2].name.should.be.exactly('default');
            result[2].variables.should.be.eql({
                var5: 110
            });
        });

        suite.testCase("test2", async function () {
            const result = await runner(jobs, null, {
                logger: nil,
                tasks,
                variables: { $env:{ var3: '95' } }
            });
            
            result[1].name.should.be.exactly('default');
            result[1].variables.should.be.eql({
                var5: 100
            });
            
        });

        suite.testCase("test3", async function () {
            const result = await runner(jobs, null, {
                logger: nil,
                tasks,
                variables: { $env:{ var3: '105' } }
            });
            
            result[2].name.should.be.exactly('default');
            result[2].variables.should.be.eql({
                var5: 105
            });
            
        });
    },
    { verbose: true }
);
