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
const _utils = require("@kitmi/utils");
const _common = require("../common");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class S3Service {
    async getUploadUrl_(...args) {
        const [objectKey, contentType, expiresInSeconds = _common.DEFAULT_UPLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'string?',
            'integer?',
            'object?'
        ]);
        const params = {
            Bucket: this.bucket,
            Key: objectKey,
            Expires: expiresInSeconds
        };
        if (contentType) {
            // most of the time, you don't know the contentType before user selected the file
            params.ContentType = contentType;
        }
        return this.client.getSignedUrl('putObject', {
            ...params,
            ...payload
        });
    }
    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = _common.DEFAULT_DOWNLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'integer?',
            'object?'
        ]);
        return this.client.getSignedUrl('getObject', {
            Bucket: this.bucket,
            Key: objectKey,
            Expires: expiresInSeconds,
            ...payload
        });
    }
    constructor(app, options){
        const { endpoint, accessKeyId, secretAccessKey, bucket } = options;
        const AWS = app.tryRequire('aws-sdk');
        const spacesEndpoint = new AWS.Endpoint(endpoint);
        this.client = new AWS.S3({
            endpoint: spacesEndpoint,
            accessKeyId,
            secretAccessKey,
            signatureVersion: 'v4'
        });
        this.bucket = bucket;
    }
}
_define_property(S3Service, "packages", [
    'aws-sdk'
]);
const _default = S3Service;

//# sourceMappingURL=S3v2.js.map