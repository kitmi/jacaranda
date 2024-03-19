const stores = [
    {
        id: 1,
        name: 'Store 1',
        address: 'Address 1',
    },
    {
        id: 2,
        name: 'Store 2',
        address: 'Address 2',
    }
];

const Store = {
    query: async (ctx) => {
        ctx.body = stores;        
    },

    findOne: async (ctx, storeId) => {
        ctx.body = stores.find(store => store.id === parseInt(storeId, 10));
    }
};

export default Store;