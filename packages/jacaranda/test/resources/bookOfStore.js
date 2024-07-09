import { _, findKey } from '@kitmi/utils';
import { Controller } from '../../src';

const storeId = '1811';

let books = {
    [storeId]: [
        { id: 1, name: 'book 1' },
        { id: 2, name: 'book 2' },
        { id: 3, name: 'book 3' },
    ],
};

class MyController extends Controller {
    async query_(ctx) {
        const reqStoreId = ctx.params.storeId;
        this.send(ctx, books[reqStoreId]);
    }

    async get_(ctx, id) {
        const reqStoreId = ctx.params.storeId;
        const book = _.find(books[reqStoreId], (book) => book.id === parseInt(id));

        this.send(ctx, book);
    }

    async post_(ctx) {
        const reqStoreId = ctx.params.storeId;
        const newBook = { ...ctx.request.body, id: books[reqStoreId].length + 1 };
        books[reqStoreId].push(newBook);

        this.send(ctx, newBook);
    }

    async put_(ctx, id) {
        const reqStoreId = ctx.params.storeId;
        const book = _.find(books[reqStoreId], (book) => book.id === parseInt(id));
        Object.assign(book, ctx.request.body);

        this.send(ctx, book);
    }

    async delete_(ctx, id) {
        const reqStoreId = ctx.params.storeId;
        const bookIndex = findKey(books[reqStoreId], (book) => book.id === parseInt(id));
        const deleted = books[reqStoreId].splice(bookIndex, 1);

        this.send(ctx, deleted[0]);
    }
}

export default MyController;
