import { Feature } from "@kitmi/jacaranda";
import http from "node:http";

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
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        const service = {
            wrapResult: (ctx, result = null, others) => {
                return {
                    status: 'success',
                    ...others,
                    result,
                };
            },
        
            wrapError: (ctx, error, others) => {
                const code = error.code || statusToError[ctx.status] || unknownError;
                                
                return {
                    status: 'error',
                    ...others,                    
                    error: {
                        code,
                        message: error.expose
                            ? error.message
                            : http.STATUS_CODES[ctx.status],
                        ...(error.info ? { info: error.info }: null)
                    },
                };
            },
        };

        app.registerService(name, service);
    }
};