import Feature from '../Feature';

/**
 * Fast image processor (sharp)
 * @module Feature_ImageProcessor
 */

export default {
    /**
     * This feature is loaded at service stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    packages: ['sharp'],

    /**
     * Load the feature
     * @param {App} app - The app module object
     * @param {object} [options] - Options for the feature
     * @returns {Promise.<*>}
     *
     * @see[methods]{@link https://sharp.pixelplumbing.com}
     *
     */
    load_: async function (app, options, name) {
        const Sharp = await app.tryRequire_('sharp');
        const service = {
            fromFile: (fileName, opts) => new Sharp(fileName, opts),
            fromBuffer: (buffer, opts) => new Sharp(buffer, opts && { raw: opts }),
            create: (opts) => new Sharp(opts && { create: opts }),
        };

        app.registerService(name, service);
    },
};
