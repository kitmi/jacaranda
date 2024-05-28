module.exports = async (step, context) => {
    let var3 = context.getVariable('var3');
    var3 += 10;
    context.update({ var3 });
};