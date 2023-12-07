import simpleCsvParser from '../src/csvLineParse';

describe('csv parser', function () {
    it('bvt', async function () {
        const result = simpleCsvParser('3293, 9123921, 321938, 3289389');
        result.should.be.eql(['3293', '9123921', '321938', '3289389']);
    });

    it('bvt2', async function () {
        const result = simpleCsvParser('someone,x,1022,1022,,/home/someone,/bin/bash');
        result.should.be.eql(['someone', 'x', '1022', '1022', '', '/home/someone', '/bin/bash']);
    });

    it('bvt3', async function () {
        const result = simpleCsvParser('someone,x,1022,1022,,/home/someone,/bin/bash', { emptyAsNull: true });
        result.should.be.eql(['someone', 'x', '1022', '1022', null, '/home/someone', '/bin/bash']);
    });

    it('quoted', async function () {
        const result = simpleCsvParser('"3293, 9123921", "321938", "328,9389"');
        result.should.be.eql(['3293, 9123921', '321938', '328,9389']);
    });

    it('quoted escaped', async function () {
        const result = simpleCsvParser('"3293, 91\\"23921", \'321938\',"328,9389"');
        result.should.be.eql(['3293, 91"23921', '321938', '328,9389']);
    });

    it('quoted escaped2', async function () {
        const result = simpleCsvParser('"32\\"93, 91\\"23921", \'3219\\\'38\',"328,9389"');
        result.should.be.eql(['32"93, 91"23921', "3219'38", '328,9389']);
    });
});
