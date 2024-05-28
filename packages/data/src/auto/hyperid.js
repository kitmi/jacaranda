const { tryRequire } = require('@genx/sys');

const instances = [ null, null, null, null ];

module.exports = function (info, i18n, options) {
    const hyperid = tryRequire('hyperid');

    let index = info && info.fixedLength ? 1 : 0;
    index += (options == null || options.urlSafe) ? 0 : 2;

    let generator = instances[index];

    if (generator == null) {
        switch (index) {
            case 0: 
                generator = hyperid({ urlSafe: true });
                break;

            case 1:
                generator = hyperid({ urlSafe: true, fixedLength: true });
                break;

            case 2:
                generator = hyperid();
                break; 

            case 3:
                generator = hyperid({ fixedLength: true });
                break; 
        }

        instances[index] = generator;
    }

    let uid = generator();
    if (options?.prefix) {
        uid = options.prefix + uid;
    }

    return uid;
};
