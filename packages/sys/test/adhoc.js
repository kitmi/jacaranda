import tryRequire from '../src/tryRequire';
import path from 'node:path'

const fs = tryRequire('fs-extra');

const content = fs.readFileSync(path.resolve(__dirname, './files/fakeLib.js'), 'utf8');

console.log(content);