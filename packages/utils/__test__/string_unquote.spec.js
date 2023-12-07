import unquote from '../src/unquote';
describe('unquote', () => {
    it('Unquote a string', () => {
        const quoteset = new Set();
        quoteset.add('"');

        const a = 1;
        const b = 'a';
        const c = 'abcde';
        const d = '"abc"';
        const e = 'aba';

        const unquote_a = unquote(a, false, quoteset);
        const unquote_b = unquote(b, false, quoteset);
        const unquote_c = unquote(c, false, quoteset);
        const unquote_d = unquote(d, true, quoteset);
        const unquote_e = unquote(e, false, quoteset);
        const unquote_d_false = unquote(d, false, quoteset);

        unquote_a.should.be.eql(a);
        unquote_b.should.be.eql(b);
        unquote_c.should.be.eql(c);
        unquote_d.should.be.eql(d.slice(1, -1));
        unquote_e.should.be.eql('aba');
        unquote_d_false.should.be.eql(d.slice(1, -1));
    });
});
