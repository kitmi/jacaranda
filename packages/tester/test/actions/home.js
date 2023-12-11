import { Unauthorized, Forbidden } from '@kitmi/types';

export default {
    index: async function (ctx) {
        ctx.body = 'Hello World!';
    },

    login: async function (ctx) {
        const { username, password } = ctx.request.body;
        if (username !== 'admin' || password !== 'admin') {
            throw new Unauthorized('Invalid username or password');
        }

        ctx.body = {
            token: 'fjieojfioajfeojf'
        };
    },

    protected: async function (ctx) {
        const authHeader = ctx.request.headers.authorization;

        if (authHeader == null) {
            throw new Forbidden('Unauthenticated');
        }

        console.log(authHeader);

        ctx.body = {
            status: 'ok'
        };
    }
};
