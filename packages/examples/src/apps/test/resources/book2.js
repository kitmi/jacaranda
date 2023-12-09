import { _ } from '@galaxar/utils';

class BookController {
    books = [ { id: 1, title: 'Book 1' }, { id: 2, title: 'Book 2' } ];
    maxid = 2;

    query(ctx) {
        ctx.body = this.books;
    }
    
    create(ctx) {
        let newBook = {id: ++this.maxid, title: ctx.request.body.title};
        this.books.push(newBook);
        ctx.body = newBook;
    }
    
    detail(ctx) {
        let id = ctx.params.id;
        ctx.body =  _.find(this.books, book => book.id == id) || {};
    }
    
    update(ctx) {
        let id = ctx.params.id;
        let bookFound = _.find(this.books, book => book.id == id);
    
        bookFound.title = ctx.request.body.title;
        ctx.body =  bookFound;
    }
    
    remove(ctx) {
        let id = ctx.params.id;
        let idx = _.findIndex(this.books, book => book.id == id);
        ctx.body = this.books.splice(idx, 1)[0];
    }
}

export default BookController;
