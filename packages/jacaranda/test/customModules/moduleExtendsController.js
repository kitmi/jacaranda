import { http, Controller } from '../../src';

class MyController extends Controller {
    @http('get:/')
    async index_(ctx) {
        this.send(ctx, { custom: ctx.custom })
    }
};

export default MyController;
