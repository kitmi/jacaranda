import { http } from '../../src';

class Controller {
    @http('get:/')
    async index_(ctx) {
        ctx.body = ctx.custom;
    }

    // use middleware bodyParser do parse body
    @http('post:/', ['bodyParser'])
    async indexPost_(ctx) {
        ctx.body = ctx.custom + ' ' + ctx.request.body.custom;
    }
};

export default Controller;
