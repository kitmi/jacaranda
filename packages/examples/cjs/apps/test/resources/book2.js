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
const _utils = require("@galaxar/utils");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class BookController {
    query(ctx) {
        ctx.body = this.books;
    }
    create(ctx) {
        let newBook = {
            id: ++this.maxid,
            title: ctx.request.body.title
        };
        this.books.push(newBook);
        ctx.body = newBook;
    }
    detail(ctx) {
        let id = ctx.params.id;
        ctx.body = _utils._.find(this.books, (book)=>book.id == id) || {};
    }
    update(ctx) {
        let id = ctx.params.id;
        let bookFound = _utils._.find(this.books, (book)=>book.id == id);
        bookFound.title = ctx.request.body.title;
        ctx.body = bookFound;
    }
    remove(ctx) {
        let id = ctx.params.id;
        let idx = _utils._.findIndex(this.books, (book)=>book.id == id);
        ctx.body = this.books.splice(idx, 1)[0];
    }
    constructor(){
        _define_property(this, "books", [
            {
                id: 1,
                title: 'Book 1'
            },
            {
                id: 2,
                title: 'Book 2'
            }
        ]);
        _define_property(this, "maxid", 2);
    }
}
const _default = BookController;

//# sourceMappingURL=book2.js.map