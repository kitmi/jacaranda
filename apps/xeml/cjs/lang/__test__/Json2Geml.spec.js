'use strict';
const { fs, glob } = require('@genx/sys');
const path = require('path');
const winston = require('winston');
const SOURCE_PATH = path.resolve(__dirname, '../../../test/unitGemlGen');
const ENT_SOURCE_PATH = path.join(SOURCE_PATH, 'entities');
const GemlCodeGen = require('../GemlCodeGen');
const Linker = require('../Linker');
describe('unit:lang:GemlCodeGen', function() {
    let logger = winston.createLogger({
        "level": "info",
        "transports": [
            new winston.transports.Console({
                "format": winston.format.combine(winston.format.colorize(), winston.format.simple())
            })
        ]
    });
    after(function() {
        const files = glob.sync(path.join(ENT_SOURCE_PATH, '*.geml'));
        files.forEach((f)=>fs.removeSync(f));
    });
    it('Generate entities', function() {
        let files = fs.readdirSync(ENT_SOURCE_PATH);
        files.forEach((f)=>{
            if (f.endsWith('.json')) {
                let json = fs.readJsonSync(path.join(ENT_SOURCE_PATH, f), 'utf8') //linker.loadModule(f);
                ;
                let content = GemlCodeGen.transform(json);
                fs.writeFileSync(path.join(ENT_SOURCE_PATH, f.substr(0, f.length - 5)), content, 'utf8');
            }
        });
    });
    it('Linking from generated', function() {
        let linker = new Linker(logger, {
            gemlPath: SOURCE_PATH,
            schemas: {
                test: {}
            }
        });
        linker.link('test.geml');
        linker.schemas.should.have.keys('test');
        linker.schemas.test.entities.should.have.keys('user', 'profile', 'gender', 'group', 'usergroup');
    });
});

//# sourceMappingURL=Json2Geml.spec.js.map