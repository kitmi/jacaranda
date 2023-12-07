import isPlainObject from '../src/isPlainObject';

describe('isplainobject', function () {
    it('Check a variable whether is plain object.', function () {
        const a = 1;
        const b = 'a';
        const c = [1];
        const d = { 1: 1 };

        class Foo {
            constructor() {
                this.a = 1;
            }
        }

        const e = new Foo();
        const f = Object.create(null);

        const after_a = isPlainObject(a);
        const after_b = isPlainObject(b);
        const after_c = isPlainObject(c);
        const after_d = isPlainObject(d);
        const after_e = isPlainObject(e);
        const after_f = isPlainObject(f);

        isPlainObject(null).should.not.be.ok;
        isPlainObject(undefined).should.not.be.ok;
        isPlainObject({}).should.be.ok;

        after_a.should.be.eql(false);
        after_b.should.be.eql(false);
        after_c.should.be.eql(false);
        after_d.should.be.eql(true);
        after_e.should.be.eql(false);
        after_f.should.be.eql(true);
    });
});
