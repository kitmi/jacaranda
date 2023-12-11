const _ = require('lodash');

const data = _.fill(Array(500000), 1).reduce((r, v, i) => (r[`k${i}`] = v, r), {});

_.each(data, (v, k) => v++);

console.log('ok');