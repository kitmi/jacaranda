const espree = require("espree");

const ast = espree.parse(`
const a = {};
const b = { ...a, key: 'value', key2: 'value2' };
`, { ecmaVersion: 'latest' });

console.dir(ast, { depth: null });