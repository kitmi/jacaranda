import { fastServe, http } from '../src';

const modules = {
    '/api': {
        hello: http.Get(async (ctx) => {
            ctx.body = {
                hello: 'Jacaranda',
            };
        }),
    },
};

const server = fastServe(modules);

export default server;
