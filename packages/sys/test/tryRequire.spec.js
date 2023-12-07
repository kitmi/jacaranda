import tryRequire from '../src/tryRequire';
import path from 'path';

describe('unit:tryRequire', function() {
    it('require a node module in dependencies',async function () {
        const lib = tryRequire('fs-extra');    
        should.exist(lib);        
    });

    it('require a non-exist module',async function () {        
        (() => {
            tryRequire('non-exist');
        }).should.throws(/Module "non-exist" not found. Try run "npm install non-exist" to install the dependency./);        
    });  

    it('require a local non-exist module',async function () {
        (() => {
            tryRequire('./fakeLib');
        }).should.throws(/Cannot find module '.\/fakeLib'/);       
         
    });  
    
    it('require a module with basePath',async function () {
        tryRequire('./fakeLib',  path.resolve(__dirname, './files'));
    });  
});