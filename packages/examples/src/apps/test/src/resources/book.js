import { _ } from '@kitmi/utils';

let books = [
    { id: 1, title: 'Book 1' },
    { id: 2, title: 'Book 2' },
];
let maxid = 2;

export default {
    list: (ctx) => {
        ctx.body = books;
    },

    create: (ctx) => {
        let newBook = { id: ++maxid, title: ctx.request.body.title };
        books.push(newBook);
        ctx.body = newBook;
    },

    detail: (ctx) => {
        let id = ctx.params.id;
        ctx.body = _.find(books, (book) => book.id == id) || {};
    },

    update: (ctx) => {
        let id = ctx.params.id;
        let bookFound = _.find(books, (book) => book.id == id);

        bookFound.title = ctx.request.body.title;
        ctx.body = bookFound;
    },

    remove: (ctx) => {
        let id = ctx.params.id;
        let idx = _.findIndex(books, (book) => book.id == id);
        ctx.body = books.splice(idx, 1)[0];
    },
};
