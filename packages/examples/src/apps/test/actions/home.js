export default {
    index: async (ctx) => {
        await ctx.render('index', { title: 'Test.index', name: 'Swig' });
    },
};
