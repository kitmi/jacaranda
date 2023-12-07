import Jsv from '../src/bundle';

describe('jsv:text', function () {
    it('startWith', function () {
        const result = Jsv.match('abc', { $startWith: 'a' });
        result[0].should.be.ok;
    });

    it('endWith', function () {
        const result = Jsv.match('abc', { $endWith: 'c' });
        result[0].should.be.ok;
    });

    it('contain', function () {
        const result = Jsv.match('abc', { $contain: 'b' });
        result[0].should.be.ok;
    });

    it('matchPattern', function () {
        const result = Jsv.match('abc', { $matchPattern: 'a.c' });
        result[0].should.be.ok;
    });
});

describe('jsv:text - nagative', function () {
    it('startWith', function () {
        const result = Jsv.match('abc', { $startWith: 'd' });
        result[0].should.not.be.ok;
    });

    it('endWith', function () {
        const result = Jsv.match('abc', { $endWith: 'b' });
        result[0].should.not.be.ok;
    });

    it('contain', function () {
        const result = Jsv.match('abc', { $contain: 'x' });
        result[0].should.not.be.ok;
    });

    it('matchPattern', function () {
        const result = Jsv.match('abc', { $matchPattern: 'adc' });
        result[0].should.not.be.ok;
    });
});

