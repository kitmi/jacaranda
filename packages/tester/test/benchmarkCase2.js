const _ = require('lodash');

let text = 'fjfjieofjain81289ncncsldmoqe8hfdoaehflanflui3hodfannfka38ye89ohcfnab1t6ugdwoejmncalnfalfjioewyuhfqwifjfjieofjain81289ncncsldmoqe8hfdoaehflanflui3hodfannfka38ye89ohcfnab1t6ugdwoejmncalnfalfjioewyuhfqwifjfjieofjain81289ncncsldmoqe8hfdoaehflanflui3hodfannfka38ye89ohcfnab1t6ugdwoejmncalnfalfjioewyuhfqwifjfjieofjain81289ncncsldmoqe8hfdoaehflanflui3hodfannfka38ye89ohcfnab1t6ugdwoejmncalnfalfjioewyuhfqwifjfjieofjain81289ncncsldmoqe8hfdoaehflanflui3hodfannfka38ye89ohcfnab1t6ugdwoejmncalnfalfjioewyuhfqwi';

for (let i = 0; i < 17; i++) {
    text += text;
}

const l = text.split('f').length - 1;
const l2 = [...text.matchAll(/f/g)].length;

if (l === l2) {
    console.log('ok');
}