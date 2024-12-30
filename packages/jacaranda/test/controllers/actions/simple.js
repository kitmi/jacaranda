export default {
    index_: async (ctx) => {
        ctx.body = 'Hello, Jacaranda!';
    },

    index2_: async (ctx) => {
        ctx.body = 'Hello, Jacaranda! 2';
    },

    mc_: async (ctx) => {
        ctx.body = `Hello, Jacaranda! ${ctx.mc}`;
    },

    req_: async (ctx) => {
        ctx.body = ctx.state.reqId;
    },
};
