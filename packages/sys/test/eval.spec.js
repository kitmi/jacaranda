import { interpolate, evaluate } from '../src/eval';

describe('unit:eval', function () {
    it('interpolate', () => {
        const result = interpolate('echo ${hello}', { hello: 'Jack' });
        result.should.equal('echo Jack');
    });

    it('evaluate', () => {
        const result = evaluate('1 + 3 + abc', { abc: 5 });
        result.should.equal(9);
    });
});
