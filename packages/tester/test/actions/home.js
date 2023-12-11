import { Unauthorized, Forbidden } from '@kitmi/types';

const fakeToken = 'fjieojfioajfeojf';

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
            token: fakeToken
        };
    },

    protected: async function (ctx) {
        const authHeader = ctx.request.headers.authorization;

        if (authHeader == null) {
            throw new Forbidden('Unauthenticated');
        }

        const [ type, token ] = authHeader.split(' ');

        if (type !== 'Bearer') {
            throw new Forbidden('Invalid authorization type');
        }   

        if (token !== fakeToken) {
            throw new Forbidden('Invalid access token');
        }

        ctx.body = {
            status: 'ok'
        };
    }
};
