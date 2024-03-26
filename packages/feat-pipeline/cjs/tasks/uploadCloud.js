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
const _allSync = require("@kitmi/validators/allSync");
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
                type: 'text'
            },
            objectKey: {
                type: 'text'
            },
            contentType: {
                type: 'text'
            },
            service: {
                type: 'text'
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
    step.stepLog('info', `Uploading to cloud...`, {
        fileName,
        objectKey,
        contentType
    });
    const result = await service.upload_(objectKey, file, contentType, payload);
    step.stepLog('info', 'Successfully uploaded.', {
        result
    });
    return result;
}

//# sourceMappingURL=uploadCloud.js.map