import { Types } from '../src';

describe('object with alternative schemas', () => {
    const objSchema = {
        schema: [
            {
                key: { type: 'text' },
            },
            {
                privateKey: { type: 'text' },
                publicKey: { type: 'text' },
            },
        ],
    };

    const objSchema2 = {
        schema: {
            key: [{ type: 'text' }, { type: 'array', element: { type: 'text' } }],
        },
    };

    it('top level', () => {
        const obj1 = { key: 'feiojfioafojo' };
        Types.OBJECT.sanitize(obj1, objSchema).should.eql(obj1);

        const obj2 = { privateKey: 'feiojfioafojo', publicKey: 'feiojfioafojo' };
        Types.OBJECT.sanitize(obj2, objSchema).should.eql(obj2);

        const obj3 = { key: 'feiojfioafojo', privateKey: 'feiojfioafojo' };
        Types.OBJECT.sanitize(obj3, objSchema).should.eql(obj1);
    });

    it('top level async', async () => {
        const obj1 = { key: 'feiojfioafojo' };
        (await Types.OBJECT.sanitize_(obj1, objSchema)).should.eql(obj1);

        const obj2 = { privateKey: 'feiojfioafojo', publicKey: 'feiojfioafojo' };
        (await Types.OBJECT.sanitize_(obj2, objSchema)).should.eql(obj2);

        const obj3 = { key: 'feiojfioafojo', privateKey: 'feiojfioafojo' };
        (await Types.OBJECT.sanitize_(obj3, objSchema)).should.eql(obj1);
    });

    it('nested', () => {
        const obj1 = { key: 'feiojfioafojo' };
        const obj2 = { key: ['feiojfioafojo', 'feiojfioafojo'] };

        Types.OBJECT.sanitize(obj1, objSchema2).should.eql(obj1);
        Types.OBJECT.sanitize(obj2, objSchema2).should.eql(obj2);
    });

    it('nested async', async () => {
        const obj1 = { key: 'feiojfioafojo' };
        const obj2 = { key: ['feiojfioafojo', 'feiojfioafojo'] };

        (await Types.OBJECT.sanitize_(obj1, objSchema2)).should.eql(obj1);
        (await Types.OBJECT.sanitize_(obj2, objSchema2)).should.eql(obj2);
    });

    it('errors 1', () => {
        const obj1 = { key2: 'feiojfioafojo' };

        try {
            Types.OBJECT.sanitize(obj1, objSchema);
        } catch (error) {
            error.message.should.eql('Object schema validation failed.');
            error.info.errors.length.should.eql(2);
            error.info.errors[0].info.path.should.eql('key');
            error.info.errors[1].info.path.should.eql('privateKey');
        }
    });

    it('errors 2', () => {
        const obj1 = { key: { some: 'value' } };

        try {
            Types.OBJECT.sanitize(obj1, objSchema2);
        } catch (error) {
            error.message.should.eql('Object member schema validation failed.');
            error.info.errors.length.should.eql(2);
            error.info.errors[0].message.should.eql('Invalid text value.');
            error.info.errors[1].message.should.eql('Invalid array value.');
        }
    });
});
