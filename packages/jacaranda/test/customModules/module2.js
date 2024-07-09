import { http } from '../../src';

class Controller {    
    @http('get:/module2') 
    async index_(ctx) {
        ctx.body = ctx.custom + ' module2';
    }
};

export default Controller;
