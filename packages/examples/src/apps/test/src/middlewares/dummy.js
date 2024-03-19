const dummy = (opts, app) => {
    return async (ctx, next) => {
        ctx.dummy = 'dummy';
        return next();
    };
};

export default dummy;
