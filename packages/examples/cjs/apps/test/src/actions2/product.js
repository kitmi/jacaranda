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
const _jacaranda = require("@kitmi/jacaranda");
const products = [
    {
        id: 1,
        name: 'product1'
    },
    {
        id: 2,
        name: 'product2'
    }
];
class Product extends _jacaranda.Controller {
    async query(ctx) {
        this.send(ctx, products);
    }
    async findOne(ctx, productId) {
        const product = products.find((p)=>p.id === parseInt(productId));
        this.send(ctx, product);
    }
}
const _default = Product;

//# sourceMappingURL=product.js.map