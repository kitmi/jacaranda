export default {
    query: (ctx) => {
        const feature = ctx.appModule.getService('appFeature');
        const param = feature.getParam();

        ctx.body = { param };
    },
};
