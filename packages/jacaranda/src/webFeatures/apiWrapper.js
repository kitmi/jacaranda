import Feature from '../Feature';
import http from 'node:http';

const statusToError = {
    400: 'invalid_request',
    401: 'unauthenticated',
    403: 'permission_denied',
    404: 'resource_not_found',
};

const unknownError = 'unknown_error';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.SERVICE,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of soal client
     * @property {boolean} [settings.debug] - Debug mode
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        const service = {
            wrapResult: (ctx, data = null, others) => {
                return {
                    status: 'ok',
                    ...ctx.resPayload,
                    ...others,
                    data,
                };
            },

            wrapError: (ctx, error, others) => {
                const code = error.code || statusToError[ctx.status] || unknownError;

                return {
                    status: 'error',
                    ...ctx.resPayload,
                    ...others,
                    error: {
                        code,
                        message: settings.debug || error.expose ? error.message : http.STATUS_CODES[ctx.status],
                        ...(error.info ? { info: error.info } : null),
                    },
                };
            },
        };

        app.registerService(name, service);
    },
};
