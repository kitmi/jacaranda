"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nodehttp = /*#__PURE__*/ _interop_require_default(require("node:http"));
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const statusToError = {
    400: 'invalid_request',
    401: 'unauthenticated',
    403: 'permission_denied',
    404: 'resource_not_found'
};
const unknownError = 'unknown_error';
const _default = {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */ stage: _Feature.default.SERVICE,
    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} settings - Settings of soal client
     * @returns {Promise.<*>}
     */ load_: async function(app, settings, name) {
        const service = {
            wrapResult: (ctx, result = null, others)=>{
                return {
                    status: 'success',
                    ...others,
                    result
                };
            },
            wrapError: (ctx, error, others)=>{
                const code = error.code || statusToError[ctx.status] || unknownError;
                return {
                    status: 'error',
                    ...others,
                    error: {
                        code,
                        message: error.expose ? error.message : _nodehttp.default.STATUS_CODES[ctx.status],
                        ...error.info ? {
                            info: error.info
                        } : null
                    }
                };
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=apiWrapper.js.map