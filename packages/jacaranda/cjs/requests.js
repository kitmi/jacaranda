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
const _superagent = /*#__PURE__*/ _interop_require_default(require("superagent"));
const _adapters = require("@kitmi/adapters");
const _types = require("@kitmi/types");
const _HttpClient = /*#__PURE__*/ _interop_require_default(require("./helpers/HttpClient"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const httpClient = new _HttpClient.default((0, _adapters.superagent)(_superagent.default), {
    onResponseError: (body, error)=>{
        throw new _types.ExternalServiceError(error.message, {
            headers: error.response.headers,
            status: error.response.status,
            body,
            clientError: error.response.error && error.response.clientError && {
                method: error.response.error.method,
                path: error.response.error.path
            },
            serverError: error.response.error && error.response.serverError && {
                message: error.response.error.message
            },
            redirect: false
        });
    }
});
const _default = httpClient;

//# sourceMappingURL=requests.js.map