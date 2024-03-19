import Jsx from '../src';

describe('Jsx:extension', function () {  
    it('extension', function () {
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
  
        Jsx.config.addTransformerToMap([ 'Custom', false, '$custom' ], (left, right) => {
            return right === 'special' ? 'special': left
        });

        Jsx.evaluate(obj, { $custom: 'nothing' }).should.be.eql(obj);
        Jsx.evaluate(obj, { $custom: 'special' }).should.be.eql('special');

    })
});