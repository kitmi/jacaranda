module.exports = async (step, context) => {
    context.update({ var3: parseInt(context.getEnv('var3')) });    
};