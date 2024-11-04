const { runtime } = require('@kitmi/jacaranda');
const { requireFrom } = require('@kitmi/sys');

const pg = requireFrom('pg', process.cwd());
runtime.loadModule('pg', pg);

module.exports = {};
