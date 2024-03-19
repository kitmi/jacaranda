"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const pets = (storeId)=>[
        {
            id: 1,
            name: 'Pet 1',
            storeId
        },
        {
            id: 2,
            name: 'Pet 2',
            storeId
        }
    ];
const Pet = {
    query: async (ctx)=>{
        const storeId = parseInt(ctx.params.storeId, 10);
        ctx.body = pets(storeId);
    },
    findOne: async (ctx, petId)=>{
        const storeId = parseInt(ctx.params.storeId, 10);
        const _pets = pets(storeId);
        ctx.body = _pets.find((store)=>store.id === parseInt(petId, 10));
    }
};
const _default = Pet;

//# sourceMappingURL=pet.js.map