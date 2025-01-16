import { fastServe, Get, Controller } from '../src';

class MyController extends Controller {
    @Get
    async hello(ctx) {
        this.send(ctx, {
            hello: 'Jacaranda',
        });
    }
}

const server = fastServe({
    '/api': MyController,
}, { engine: { port: 3389 }, apiWrapper: {} });

export default server;
