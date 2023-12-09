import { httpMethod } from '../../../../../../lib';

async function middleware1(ctx, next) {
    ctx.state1 = 'Hello';
    return next();
}

export default {
    action1: httpMethod('get')(async (ctx) => {
        ctx.body = 'action1';
    }),

    post: httpMethod('post:/action1')(async (ctx) => {
        ctx.body = 'you post: ' + ctx.request.body.name;
    }),

    action2: httpMethod(
        'get',
        middleware1
    )(async (ctx) => {
        ctx.body = ctx.state1;
    }),

    action3: async (ctx) => {
        ctx.body = ctx.state1;
    },

    action4: httpMethod('get')(async (ctx) => {
        ctx.body = ctx.dummy;
    }),
};
