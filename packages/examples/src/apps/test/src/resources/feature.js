export default {
    list: (ctx) => {
        const feature = ctx.module.getService('appFeature');
        const param = feature.getParam();

        ctx.body = { param };
    },
};
