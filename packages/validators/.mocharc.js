require('@swc-node/register');
require('@kitmi/utils/testRegister');

module.exports = {
    timeout: 300000,
    require: ['@kitmi/tester'],
    reporter: 'mocha-multi',
    reporterOptions: 'mocha-multi=test/mocha-multi-reporters.json',
    noParallel: true
};
