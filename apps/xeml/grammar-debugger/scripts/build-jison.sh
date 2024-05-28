#!/bin/sh

# build up the version of jison.js used in the web worker
cd node_modules/jison
npm install
cd -
./node_modules/.bin/browserify --exports require node_modules/jison/entry.js > src/util/jison.js
