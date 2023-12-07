import Jxs from '../src';
const { Types } = require('@kit/types');

describe.skip('Jxs:extension', function () {  
    it('sanitize', function () {
        let obj = {
            'intKey': 100,
            'strKey': 'string',
            'arrayKey': [
                {
                    key1: 'value1',
                    key2: '0'
                },
                {
                    key1: 'value2',
                    key2: '1'
                }
            ],
            'objKey': {
                'objKey2': {
                    intKey: 1,
                    boolKey: 'true'
                }
            }
        };
    
        let schema = {
            'intKey': { type: 'integer' },
            'intKey2': { type: 'integer', optional: true, 'default': 200 },
            'strKey': { type: 'text' },
            'arrayKey': { type: 'array', 'elementSchema': {
                type: 'object', schema: {
                    key1: { type: 'text' },
                    key2: { type: 'boolean' },
                }
            } },
            'objKey': {
                type: 'object',
                schema: {
                    'objKey2': {
                        type: 'object',
                        schema: {
                            intKey: { type: 'integer' },
                            boolKey: { type: 'boolean' }
                        }
                    }
                }
            }
        };

        Jxs.config.addTransformerToMap([ 'Sanitize', false, '$sanitize' ], (left, right) => {
            return Types.OBJECT.sanitize(left, { schema: right });
        });

        const sanitized = Jxs.evaluate(obj, { $sanitize: schema });

         let expected = {
            intKey: 100,
            intKey2: 200,
            strKey: 'string',
            arrayKey: [ { key1: 'value1', key2: false }, { key1: 'value2', key2: true } ],
            objKey: { objKey2: { intKey: 1, boolKey: true } }
        };
        
        //a.should.be.eql(1);
        sanitized.should.be.eql(expected);
    })
});