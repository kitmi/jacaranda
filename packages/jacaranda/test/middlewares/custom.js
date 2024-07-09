const custom = async (opt, app) => {    
    return async (ctx, next) => {
        ctx.custom = 'custom';
        return next();        
    };
};

export default custom;