/*
 fatest
 split x 17,058,358 ops/sec ±0.17% (101 runs sampled)
 match x 1,684,639 ops/sec ±0.48% (96 runs sampled)
 replace x 3,797,425 ops/sec ±1.14% (94 runs sampled)
 countOfChar x 7,186,814 ops/sec ±0.49% (98 runs sampled)
*/
const splitCount = (str, char) => str.split(char).length - 1;

export default splitCount;
