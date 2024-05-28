const Types = require('../types');

function auto(info, i18n) {
    if (info.generator) {
        let name, options;

        // customized generator
        if (typeof info.generator === 'string') {
            name = info.generator;
        } else if (Array.isArray(info.generator)) {            
            name = info.generator[0];

            if (info.generator.length > 1) {
                options = info.generator[1];
            }
        } else {
            name = info.generator.name;
            options = info.generator.options;
        }

        const G = require('../Generators');
        const gtor = G[name];
        return gtor(info, i18n, options);
    }

    const typeObjerct = Types[info.type];
    return typeObjerct.generate(info, i18n);
}

module.exports = auto;
