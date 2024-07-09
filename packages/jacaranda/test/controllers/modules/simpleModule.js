import { http } from '../../../src';

class Controller {
    @http('get:/')
    async index_(ctx) {
        ctx.body = 'Hello, Jacaranda!';
    }
};

export default Controller;
