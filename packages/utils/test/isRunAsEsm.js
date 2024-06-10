import isRunAsEsm from '../src/isRunAsEsm.js';

const isEsm = isRunAsEsm();
console.log(isEsm); // should be true when directly run by node