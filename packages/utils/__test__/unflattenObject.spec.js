import unflattenObject from '../src/unflattenObject';

describe('unflattenObject', () => {
    const obj1 = {
        a: {
            b: {
                c: {
                    d: 10,
                    e: 20,
                },
                f: 30,
            },
            g: 40,
        },
        h: 50,
    };

    it('unflattenObject 1', () => {
        const obj2 = unflattenObject(
            {
                'a-b-c-d': 10,
                'a-b-c-e': 20,
                'a-b-f': 30,
                'a-g': 40,
                'h': 50,
            },
            '-'
        );

        obj2.should.be.eql(obj1);
    });

    it('unflattenObject 2', () => {
        const obj2 = unflattenObject({
            'a.b.c.d': 10,
            'a.b.c.e': 20,
            'a.b.f': 30,
            'a.g': 40,
            'h': 50,
        });

        obj2.should.be.eql(obj1);
    });

    it('unflattenObject 3', () => {
        const obj3 = {
            a: {
                b: {
                    c: {
                        d: 10,
                        e: 20,
                    },
                    f: 30,
                },
                g: 40,
            },
            h: [{ i: 1, j: 2 }, 50],
        };

        const obj2 = unflattenObject({
            'a.b.c.d': 10,
            'a.b.c.e': 20,
            'a.b.f': 30,
            'a.g': 40,
            'h.0.i': 1,
            'h.0.j': 2,
            'h.1': 50,
        });

        obj2.should.be.eql(obj3);
    });
});
