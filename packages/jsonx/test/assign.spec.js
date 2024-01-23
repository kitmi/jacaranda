import Jsx from '../src';

describe('jsx:assign', function () {
    it('object', function () {
        Jsx.evaluate(
            {
                key1: 1,
                key2: 2,
            },
            {
                $assign: {
                    key3: 3,
                },
            }
        ).should.be.eql({
            key1: 1,
            key2: 2,
            key3: 3,
        });
    });

    it('object with undefined', function () {
        Jsx.evaluate(
            {
                key1: 1,
                key2: 2,
            },
            {
                $assign: {
                    key2: undefined,
                },
            }
        ).should.be.eql({
            key1: 1,
        });
    });

    it('assign with expr', function () {
        Jsx.evaluate(
            {
                key1: 1,
                key2: 2,
            },
            {
                $assign: {
                    key2: {
                        $expr: {
                            $mul: 10,
                        },
                    },
                },
            }
        ).should.be.eql({
            key1: 1,
            key2: 20,
        });
    });
});
