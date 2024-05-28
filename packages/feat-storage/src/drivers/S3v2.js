import { fxargs } from '@kitmi/utils';
import { DEFAULT_UPLOAD_EXPIRY, DEFAULT_DOWNLOAD_EXPIRY } from '../common';

class S3Service {
    static packages = ['aws-sdk'];

    constructor(app, options) {
        const { endpoint, accessKeyId, secretAccessKey, bucket } = options;

        const AWS = app.tryRequire('aws-sdk');

        const spacesEndpoint = new AWS.Endpoint(endpoint);

        this.client = new AWS.S3({
            endpoint: spacesEndpoint,
            accessKeyId,
            secretAccessKey,
            signatureVersion: 'v4',
        });

        this.bucket = bucket;
    }

    async getUploadUrl_(...args) {
        const [objectKey, contentType, expiresInSeconds = DEFAULT_UPLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'string?',
            'integer?',
            'object?',
        ]);

        const params = {
            Bucket: this.bucket,
            Key: objectKey,
            Expires: expiresInSeconds,
        };

        if (contentType) {
            // most of the time, you don't know the contentType before user selected the file
            params.ContentType = contentType;
        }

        return this.client.getSignedUrl('putObject', {
            ...params,
            ...payload,
        });
    }

    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = DEFAULT_DOWNLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'integer?',
            'object?',
        ]);

        return this.client.getSignedUrl('getObject', {
            Bucket: this.bucket,
            Key: objectKey,
            Expires: expiresInSeconds,
            ...payload,
        });
    }
}

export default S3Service;
