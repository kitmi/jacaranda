require('@swc-node/register');
require('@kitmi/utils/testRegister');

const { runtime } = require('@kitmi/jacaranda');
const { requireFrom } = require('@kitmi/sys');

const pg = requireFrom('pg', process.cwd());
runtime.loadModule('pg', pg);

const rabbitmq = requireFrom('rabbitmq-client', process.cwd());
runtime.loadModule('rabbitmq-client', rabbitmq);

module.exports = {
    timeout: 300000,
    require: ['@kitmi/tester', './test/lib/helpers.js'],
    reporter: 'mocha-multi',
    reporterOptions: 'mocha-multi=test/mocha-multi-reporters.json',
};
