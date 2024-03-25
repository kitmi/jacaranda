"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return uploadCloud;
    }
});
const _jacaranda = require("@kitmi/jacaranda");
const _adapters = require("@kitmi/adapters");
const _allSync = require("@kitmi/validtors/allSync");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function uploadCloud(step, settings) {
    let { file, objectKey, contentType, service, payload } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            file: {
                type: 'string'
            },
            objectKey: {
                type: 'string'
            },
            contentType: {
                type: 'string'
            },
            service: {
                type: 'string'
            },
            payload: {
                type: 'object',
                optional: true
            }
        }
    });
    file = step.getValue(file);
    objectKey = step.getValue(objectKey);
    contentType = step.getValue(contentType);
    service = step.getService(service);
    const fileName = _nodepath.default.basename(file);
    const httpClient = new _jacaranda.HttpClient((0, _adapters.superagent)());
    const url = await service.getUploadUrl_(objectKey, contentType, payload);
    step.stepLog('info', `Uploading to: ${url}`, {
        fileName,
        objectKey,
        contentType
    });
    const result = await httpClient.upload(url, file, null, {
        httpMethod: 'put',
        headers: {
            'Content-Type': contentType
        },
        fileName
    });
    step.stepLog('info', 'Successfully uploaded.', {
        result
    });
    return result;
}

//# sourceMappingURL=uploadCloud.js.map