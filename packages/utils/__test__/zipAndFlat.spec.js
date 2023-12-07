import zipAndFlat from '../src/zipAndFlat';
import _ from 'lodash';

describe('unit:zipAndFlat', function () {
    it('bvt', async function () {
        const a1 = ['a', 'b', 'c', 'd'];
        const a2 = [1, 2, 3, 4];

        const r = zipAndFlat(a1, a2);

        const e = _.flatten(_.zip(a1, a2));

        r.should.be.eql(e);
    });

    it('diff length', async function () {
        const a1 = ['a', 'b'];
        const a2 = [1, 2, 3];

        const r = zipAndFlat(a1, a2);

        r.should.be.eql(['a', 1, 'b', 2, 3]);
    });

    it('a1 empty', async function () {
        const a1 = [];
        const a2 = [1, 2, 3, 4];

        const r = zipAndFlat(a1, a2);

        r.should.be.eql(a2);
    });

    it('a2 empty', async function () {
        const a1 = ['a', 'b', 'c', 'd'];
        const a2 = [];

        const r = zipAndFlat(a1, a2);

        r.should.be.eql(a1);
    });

    it('a1 null', async function () {
        const a1 = null;
        const a2 = [1, 2, 3, 4];

        const r = zipAndFlat(a1, a2);

        r.should.be.eql(a2);
    });
});
