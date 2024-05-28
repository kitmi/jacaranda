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
const _sys = require("@kitmi/sys");
const _allSync = require("@kitmi/validators/allSync");
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
    async upload_(...args) {
        const [objectKey, file, contentType, payload] = (0, _utils.fxargs)(args, [
            'string',
            'string',
            'string?',
            'object?'
        ]);
        const { PutObjectCommand } = this.SDK;
        const putObjectInput = {
            Bucket: this.bucket,
            Key: objectKey,
            Body: _sys.fs.createReadStream(file)
        };
        if (payload?.publicRead) {
            putObjectInput.ACL = 'public-read';
        }
        if (contentType) {
            // most of the time, you don't know the contentType before user selected the file
            putObjectInput.ContentType = contentType;
        }
        const command = new PutObjectCommand(putObjectInput);
        const result = await this.client.send(command);
        result.url = `https://s3.${this.region}.amazonaws.com/${this.bucket}/${objectKey}`;
        return result;
    }
    async getUploadUrl_(...args) {
        const [objectKey, contentType, expiresInSeconds = _common.DEFAULT_UPLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'string?',
            'integer?',
            'object?'
        ]);
        const { PutObjectCommand } = this.SDK;
        /**
         * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules/putobjectrequest.html
         */ const putObjectInput = {
            Bucket: this.bucket,
            Key: objectKey
        };
        if (payload?.publicRead) {
            putObjectInput.ACL = 'public-read';
        }
        if (contentType) {
            // most of the time, you don't know the contentType before user selected the file
            putObjectInput.ContentType = contentType;
        }
        const command = new PutObjectCommand(putObjectInput);
        return this.presigner.getSignedUrl(this.client, command, {
            expiresIn: expiresInSeconds
        });
    }
    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = _common.DEFAULT_DOWNLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'integer?',
            'object?'
        ]);
        const { GetObjectCommand } = this.SDK;
        const getObjectInput = {
            Bucket: this.bucket,
            Key: objectKey,
            ...payload
        };
        const command = new GetObjectCommand(getObjectInput);
        return this.presigner.getSignedUrl(this.client, command, {
            expiresIn: expiresInSeconds
        });
    }
    constructor(app, options){
        let { region, accessKeyId, secretAccessKey, bucket } = _allSync.Types.OBJECT.sanitize(options, {
            schema: {
                region: {
                    type: 'text'
                },
                accessKeyId: {
                    type: 'text'
                },
                secretAccessKey: {
                    type: 'text'
                },
                bucket: {
                    type: 'text'
                }
            }
        });
        const vars = app.getRuntimeVariables();
        region = (0, _utils.esTemplate)(region, vars);
        accessKeyId = (0, _utils.esTemplate)(accessKeyId, vars);
        secretAccessKey = (0, _utils.esTemplate)(secretAccessKey, vars);
        bucket = (0, _utils.esTemplate)(bucket, vars);
        this.SDK = app.tryRequire('@aws-sdk/client-s3');
        const S3Client = this.SDK.S3Client;
        this.presigner = app.tryRequire('@aws-sdk/s3-request-presigner');
        this.client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
        this.region = region;
        this.bucket = bucket;
    }
}
_define_property(S3Service, "packages", [
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner'
]);
const _default = S3Service;

//# sourceMappingURL=S3v3.js.map