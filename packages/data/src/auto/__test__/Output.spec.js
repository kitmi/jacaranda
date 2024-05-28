'use strict';

const hyperid = require('../hyperid');
const uniqid = require('../uniqid');
const uuid = require('../uuid');

describe('unit:generators:auto', function () {        
    describe('hyperid', function () {
        it('var length', async function () {
            let id = hyperid({ type: 'text' });
            
            console.log(id);
        });

        it('var length url unsafe', async function () {
            let id = hyperid({ type: 'text' }, null, { urlSafe: false });
            
            console.log(id);
        });

        it('fixed length', async function () {
            let id = hyperid({ fixedLength: true });
            
            console.log(id);
        });

        it('fixed length url unsafe', async function () {
            let id = hyperid({ fixedLength: true }, null, { urlSafe: false });
            
            console.log(id);
        });
    });

    describe('uniqid', function () {
        it('length', async function () {
            let id = uniqid({ type: 'text' });
            
            console.log(id);
        });
    });

    describe('uuid', function () {
        it('length', async function () {
            let id = uuid({ type: 'text' });
            
            console.log(id);
        });
    });
});