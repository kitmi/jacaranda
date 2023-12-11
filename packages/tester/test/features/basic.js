export default {    
    load_: function (app, config, name) {
        app.registerService(name, (value) => {
            return value + config.input;
        });
    },
};
