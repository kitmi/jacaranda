const testSuite = require("@genx/test");
const runner = require("../src/runner");
const nil = require("../src/loggers/nil");

const jobs = require('./custom-tasks.jobs.json');
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

            result[0].name.should.be.exactly('job1');
            result[0].variables.should.be.eql({
                var3: 105
            });

            result[1].name.should.be.exactly('default');
            result[1].variables.should.be.eql({
                var4: 105, 
                var5: 105
            });
        });
    },
    { verbose: true }
);
