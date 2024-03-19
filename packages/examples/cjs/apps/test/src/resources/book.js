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
const _utils = require("@kitmi/utils");
let books = [
    {
        id: 1,
        title: 'Book 1'
    },
    {
        id: 2,
        title: 'Book 2'
    }
];
let maxid = 2;
const _default = {
    list: (ctx)=>{
        ctx.body = books;
    },
    create: (ctx)=>{
        let newBook = {
            id: ++maxid,
            title: ctx.request.body.title
        };
        books.push(newBook);
        ctx.body = newBook;
    },
    detail: (ctx)=>{
        let id = ctx.params.id;
        ctx.body = _utils._.find(books, (book)=>book.id == id) || {};
    },
    update: (ctx)=>{
        let id = ctx.params.id;
        let bookFound = _utils._.find(books, (book)=>book.id == id);
        bookFound.title = ctx.request.body.title;
        ctx.body = bookFound;
    },
    remove: (ctx)=>{
        let id = ctx.params.id;
        let idx = _utils._.findIndex(books, (book)=>book.id == id);
        ctx.body = books.splice(idx, 1)[0];
    }
};

//# sourceMappingURL=book.js.map