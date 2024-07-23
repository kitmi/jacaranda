// connect two koa middleware functions

export default function connect(...middlewares) {
    return async (ctx, next) => middlewares.reverse().reduce((prev, curr) => {
        return () => curr(ctx, prev);
    }, next)();
}