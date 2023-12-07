import { toPathArray, makePathArray, makePath } from '../src/objectPathUtils';

describe('pathUtils', () => {
    it('to path array', () => {
        let a = toPathArray('a.b.10.d');
        a.should.be.eql(['a', 'b', '10', 'd']);

        a = toPathArray(null);
        a.should.be.eql([]);

        a = toPathArray(['a', 'b', 'c']);
        a.should.be.eql(['a', 'b', 'c']);
    });

    it('make path array', () => {
        let a = makePathArray(20, 'a.b.10.d');
        a.should.be.eql([20, 'a', 'b', '10', 'd']);

        a = makePathArray(null, ['a', 'b', 'c']);
        a.should.be.eql(['a', 'b', 'c']);

        a = makePathArray(['a', 'b', 'c'], ['d']);
        a.should.be.eql(['a', 'b', 'c', 'd']);
    });

    it('make path', () => {
        let a = makePath(20, 'a.b.10.d');
        a.should.be.eql('20.a.b.10.d');

        a = makePath(null, ['a', 'b', 'c']);
        a.should.be.eql('a.b.c');

        a = makePath(['a', 'b', 'c'], ['d']);
        a.should.be.eql('a.b.c.d');

        a = makePath(['a', 'b', 'c'], null);
        a.should.be.eql('a.b.c');

        a = makePath('a.b.c', null);
        a.should.be.eql('a.b.c');

        a = makePath(null, 'a.b.c');
        a.should.be.eql('a.b.c');

        a = makePath('a.b.c', 'd.e');
        a.should.be.eql('a.b.c.d.e');

        a = makePath(['a', 'b', 'c'], ['d', 'e'], '-');
        a.should.be.eql('a-b-c-d-e');
    });
});
