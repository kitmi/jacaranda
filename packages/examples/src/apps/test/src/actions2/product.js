import { Controller } from '@kitmi/jacaranda';

const products = [
    {
        id: 1,
        name: 'product1',
    },
    {
        id: 2,
        name: 'product2',
    },
];

class Product extends Controller {
    async query(ctx) {
        this.send(ctx, products);
    }

    async findOne(ctx, productId) {
        const product = products.find((p) => p.id === parseInt(productId));
        this.send(ctx, product);
    }
}

export default Product;
