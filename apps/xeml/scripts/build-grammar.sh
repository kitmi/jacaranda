#!/bin/sh

./node_modules/.bin/jison ./src/lang/grammar/xeml.jison -m commonjs -o ./src/lang/grammar/xeml.js 

# cp ./src/lang/grammar/xeml.jison ./grammar-debugger/public/xeml.jison

npm run build