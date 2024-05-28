require('@swc-node/register'); // for esmodule and commonjs hybid mode
require('@kitmi/utils/testRegister'); // adding should and expect dialects for chai

module.exports = {
    timeout: 300000,
    require: ['@kitmi/tester'],
    reporter: 'mocha-multi', // for combining console reporter and allure reporter
    reporterOptions: 'mocha-multi=test/mocha-multi-reporters.json', // as above
};
