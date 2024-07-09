describe('server', function () {
    it('action from registry', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from simple of ./test/controllers/actions/index.js
            const res = await client.get('/simple');
            res.should.be.eql('Hello, Jacaranda!');
        });
    });

    it('action from project path', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // directly from ./test/actions/simple2.js
            const res = await client.get('/simple2');
            res.should.be.eql('Hello, Jacaranda! 2');
        });
    });

    it('module from registry', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from simpleModule of ./test/controllers/modules/index.js
            const res = await client.get('/simple-module');
            res.should.be.eql('Hello, Jacaranda!');
        });
    });

    it('module from project path 1', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // directly from ./test/customModules/moduleWithPost.js
            const res = await client.get('/multi-modules');
            res.should.be.eql('custom');

            const res2 = await client.post('/multi-modules', {
                custom: 'data',
            });
            res2.should.be.eql('custom data');
        });
    });

    it('module from project path 2', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // directly from ./test/customModules/moduleWithPost.js
            const res = await client.get('/multi-modules/module2');
            res.should.be.eql('custom module2');
        });
    });

    it('module from project with built-in controller', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // directly from ./test/customModules/moduleExtendsController.js
            const res = await client.get('/multi-modules/abc');
            res.status.should.be.exactly('success');
            res.result.should.be.eql({
                custom: 'custom',
            });
        });
    });

    it('resource from registry', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from book of ./test/controllers/resources/index.js

            // get book list
            let res = await client.get('/rest1/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });

            // get book with id=2
            res = await client.get('/rest1/book/2');
            res.should.be.eql({
                status: 'success',
                result: { id: 2, name: 'book 2' },
            });

            // add new book
            res = await client.post('/rest1/book', {
                name: 'my book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my book' },
            });

            // update book with id=4
            res = await client.put('/rest1/book/4', {
                name: 'my new book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest1/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            // delete book with id=4
            res = await client.get('/rest1/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                    { id: 4, name: 'my new book' },
                ],
            });

            res = await client.del('/rest1/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest1/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });
        });
    });

    it('resource from project path and dasherized url', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from anotherBook of ./test/resources/index.js

            // get book list
            let res = await client.get('/rest2/another-book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });

            // get book with id=2
            res = await client.get('/rest2/another-book/2');
            res.should.be.eql({
                status: 'success',
                result: { id: 2, name: 'book 2' },
            });

            // add new book
            res = await client.post('/rest2/another-book', {
                name: 'my book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my book' },
            });

            // update book with id=4
            res = await client.put('/rest2/another-book/4', {
                name: 'my new book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest2/another-book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            // delete book with id=4
            res = await client.get('/rest2/another-book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                    { id: 4, name: 'my new book' },
                ],
            });

            res = await client.del('/rest2/another-book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest2/another-book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });
        });
    });

    it('resource from project path and remap to nested url', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from anotherBook of ./test/resources/index.js

            // get book list
            let res = await client.get('/rest2/store/1811/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });

            // get book with id=2
            res = await client.get('/rest2/store/1811/book/2');
            res.should.be.eql({
                status: 'success',
                result: { id: 2, name: 'book 2' },
            });

            // add new book
            res = await client.post('/rest2/store/1811/book', {
                name: 'my book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my book' },
            });

            // update book with id=4
            res = await client.put('/rest2/store/1811/book/4', {
                name: 'my new book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest2/store/1811/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            // delete book with id=4
            res = await client.get('/rest2/store/1811/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                    { id: 4, name: 'my new book' },
                ],
            });

            res = await client.del('/rest2/store/1811/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest2/store/1811/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });
        });
    });

    it('resource from registry with rest router', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from book of ./test/controllers/restful/index.js

            // get book list
            let res = await client.get('/rest3/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });

            // get book with id=2
            res = await client.get('/rest3/book/2');
            res.should.be.eql({
                status: 'success',
                result: { id: 2, name: 'book 2' },
            });

            // add new book
            res = await client.post('/rest3/book', {
                name: 'my book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my book' },
            });

            // update book with id=4
            res = await client.put('/rest3/book/4', {
                name: 'my new book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest3/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            // delete book with id=4
            res = await client.get('/rest3/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                    { id: 4, name: 'my new book' },
                ],
            });

            res = await client.del('/rest3/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest3/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });
        });
    });

    it('resource from project path with rest router & nested url', async function () {
        await jacat.withClient_('server1', async (client, server) => {
            // from book of ./test/controllers/restful/index.js

            // get book list
            let res = await client.get('/rest4/some/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });

            // get book with id=2
            res = await client.get('/rest4/some/book/2');
            res.should.be.eql({
                status: 'success',
                result: { id: 2, name: 'book 2' },
            });

            // add new book
            res = await client.post('/rest4/some/book', {
                name: 'my book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my book' },
            });

            // update book with id=4
            res = await client.put('/rest4/some/book/4', {
                name: 'my new book',
            });
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest4/some/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            // delete book with id=4
            res = await client.get('/rest4/some/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                    { id: 4, name: 'my new book' },
                ],
            });

            res = await client.del('/rest4/some/book/4');
            res.should.be.eql({
                status: 'success',
                result: { id: 4, name: 'my new book' },
            });

            res = await client.get('/rest4/some/book');
            res.should.be.eql({
                status: 'success',
                result: [
                    { id: 1, name: 'book 1' },
                    { id: 2, name: 'book 2' },
                    { id: 3, name: 'book 3' },
                ],
            });
        });
    });
});
