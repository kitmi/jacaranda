import { connect } from '../../src';

const custom = async (opt, app) => {    
    return connect(async (ctx, next) => {
        console.log('m1');
        ctx.mc = 10;
        return next();        
    }, async (ctx, next) => {
        console.log('m2');
        ctx.mc = 20;
        return next();        
    });
};

export default custom;