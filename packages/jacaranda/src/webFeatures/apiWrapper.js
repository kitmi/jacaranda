import Feature from '../Feature';
import http from 'node:http';
import { _ } from '@kitmi/utils';

const statusToError = {
    400: 'invalid_request',
    401: 'unauthenticated',
    403: 'permission_denied',
    404: 'resource_not_found',
};

const unknownError = 'unknown_error';

function removeReservedMeta(info) {
    return _.reduce(
        info,
        (result, value, key) => {
            if (key[0] === '$') return result;
            result[key] = value;
            return result;
        },
        {}
    );
}

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
     * @property {string} [settings.dataField="data"] - Data field name
     * @returns {Promise.<*>}
     */
    load_: async function (app, settings, name) {
        const service = {
            wrapResult: (ctx, data = null, others) => {
                return {
                    status: 'ok',
                    ...ctx.resPayload,
                    ...others,
                    [settings?.dataField || 'data']: data,
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
                        message: settings?.debug || error.expose ? error.message : http.STATUS_CODES[ctx.status],
                        ...(error.info ? { info: removeReservedMeta(error.info) } : null),
                    },
                };
            },
        };

        app.registerService(name, service);
    },
};
