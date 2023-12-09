"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * Fast image processor (sharp)
 * @module Feature_ImageProcessor
 */ "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */ stage: _Feature.default.SERVICE,
    packages: [
        'sharp'
    ],
    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} [options] - Options for the feature
     * @returns {Promise.<*>}
     *
     * @see[methods]{@link https://sharp.pixelplumbing.com}
     *
     */ load_: async function(app, options, name) {
        const Sharp = await app.tryRequire_('sharp');
        const service = {
            fromFile: (fileName, opts)=>new Sharp(fileName, opts),
            fromBuffer: (buffer, opts)=>new Sharp(buffer, opts && {
                    raw: opts
                }),
            create: (opts)=>new Sharp(opts && {
                    create: opts
                })
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=imageProcessor.js.map