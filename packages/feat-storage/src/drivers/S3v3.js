import { fxargs, esTemplate } from '@kitmi/utils';
import { fs } from '@kitmi/sys';
import { Types } from '@kitmi/validators/allSync';
import { DEFAULT_UPLOAD_EXPIRY, DEFAULT_DOWNLOAD_EXPIRY } from '../common';

class S3Service {
    static packages = ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'];

    constructor(app, options) {
        let { region, accessKeyId, secretAccessKey, bucket } = Types.OBJECT.sanitize(options, {
            schema: {
                region: { type: 'text' },
                accessKeyId: { type: 'text' },
                secretAccessKey: { type: 'text' },
                bucket: { type: 'text' },
            },
        });

        const vars = app.getRuntimeVariables();

        region = esTemplate(region, vars);
        accessKeyId = esTemplate(accessKeyId, vars);
        secretAccessKey = esTemplate(secretAccessKey, vars);
        bucket = esTemplate(bucket, vars);

        this.SDK = app.tryRequire('@aws-sdk/client-s3');
        const S3Client = this.SDK.S3Client;

        this.presigner = app.tryRequire('@aws-sdk/s3-request-presigner');

        this.client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        this.region = region;
        this.bucket = bucket;
    }

    async upload_(...args) {
        const [objectKey, file, contentType, payload] = fxargs(args, ['string', 'string', 'string?', 'object?']);

        const { PutObjectCommand } = this.SDK;

        const putObjectInput = {
            Bucket: this.bucket,
            Key: objectKey,
            Body: fs.createReadStream(file),
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
        const [objectKey, contentType, expiresInSeconds = DEFAULT_UPLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'string?',
            'integer?',
            'object?',
        ]);

        const { PutObjectCommand } = this.SDK;

        /**
         * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules/putobjectrequest.html
         */
        const putObjectInput = {
            Bucket: this.bucket,
            Key: objectKey,
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
            expiresIn: expiresInSeconds,
        });
    }

    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = DEFAULT_DOWNLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'integer?',
            'object?',
        ]);

        const { GetObjectCommand } = this.SDK;

        const getObjectInput = {
            Bucket: this.bucket,
            Key: objectKey,
            ...payload,
        };

        const command = new GetObjectCommand(getObjectInput);

        return this.presigner.getSignedUrl(this.client, command, {
            expiresIn: expiresInSeconds,
        });
    }
}

export default S3Service;
