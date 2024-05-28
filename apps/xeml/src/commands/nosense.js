/**
 * No sense
 * @returns {Promise}
 */
module.exports = async (app, context) => {
    app.log('verbose', `${app.name} nosense`);
    app.log('info', 'Nothing.');
};
