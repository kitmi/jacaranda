const pets = (storeId) => [
    {
        id: 1,
        name: 'Pet 1',
        storeId,
    },
    {
        id: 2,
        name: 'Pet 2',
        storeId,
    },
];

const Pet = {
    query: async (ctx) => {
        const storeId = parseInt(ctx.params.storeId, 10);

        ctx.body = pets(storeId);
    },

    findOne: async (ctx, petId) => {
        const storeId = parseInt(ctx.params.storeId, 10);
        const _pets = pets(storeId);

        ctx.body = _pets.find((store) => store.id === parseInt(petId, 10));
    },
};

export default Pet;
