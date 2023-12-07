import { createTypeSystem } from '../src';

const postProcess_ = async (value, meta, opts) => {
    if (meta.modifiers) {
        for (const modifier of meta.modifiers) {
            value = await modifier(value, meta, opts);
        }
    }

    return value;
};

describe('post process', () => {
    let typeSystem;

    before(() => {
        typeSystem = createTypeSystem();
        typeSystem.addPlugin('postProcess', postProcess_);
    });

    it('async object', async () => {
        const schema = {
            type: 'object',
            schema: {
                foo: {
                    type: 'text',
                    modifiers: [
                        async (value, meta, opts) => {
                            return value + 'bar';
                        },
                    ],
                },
            },
        };

        const value = await typeSystem.sanitize_({ foo: 'foo' }, schema);
        value.should.be.eql({ foo: 'foobar' });
    });

    it('async array', async () => {
        const schema = {
            type: 'array',
            elementSchema: {
                type: 'text',
                modifiers: [
                    async (value, meta, opts) => {
                        return value + 'bar1';
                    },

                    async (value, meta, opts) => {
                        return value + 'bar2';
                    },
                ],
            },
        };

        const value = await typeSystem.sanitize_(['foo1', 'foo2'], schema);
        value.should.be.eql(['foo1bar1bar2', 'foo2bar1bar2']);
    });
});
