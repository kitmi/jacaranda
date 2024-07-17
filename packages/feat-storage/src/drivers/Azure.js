import { ApplicationError } from '@kitmi/types';
import { fxargs } from '@kitmi/utils';
import { DEFAULT_UPLOAD_EXPIRY, DEFAULT_DOWNLOAD_EXPIRY } from '../common';

class AzureService {
    static packages = ['@azure/storage-blob'];

    constructor(app, options) {
        if (!app.enabled('i18n')) {
            throw new ApplicationError('"i18n" feature is required.');
        }   

        const { accountName, accountKey, bucket: containerName } = options;
        const StorageBlob = app.tryRequire('@azure/storage-blob');

        this.app = app;

        const { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions } = StorageBlob;

        // Use StorageSharedKeyCredential with storage account and account key
        // StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const endpoint = `https://${accountName}.blob.core.windows.net`;

        const blobServiceClient = new BlobServiceClient(endpoint, sharedKeyCredential);

        this.client = blobServiceClient.getContainerClient(containerName);

        this.createBlobSASPermissions = () => new BlobSASPermissions();
    }

    async getUploadUrl_(...args) {
        const [objectKey, contentType, expiresInSeconds = DEFAULT_UPLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'string',
            'integer?',
            'object?',
        ]);

        const blockBlobClient = this.client.getBlockBlobClient(objectKey);
        const permissions = this.createBlobSASPermissions();
        permissions.create = true;
        permissions.write = true;

        const expiresOn = this.app.i18n().plus({ seconds: expiresInSeconds }).toJSDate();

        const options = {
            expiresOn,
            permissions,
            contentType,
            ...payload,
        };

        return blockBlobClient.generateSasUrl(options);
    }

    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = DEFAULT_DOWNLOAD_EXPIRY, payload] = fxargs(args, [
            'string',
            'integer?',
            'object?',
        ]);

        const blockBlobClient = this.client.getBlockBlobClient(objectKey);
        const permissions = this.createBlobSASPermissions();
        permissions.read = true;

        const expiresOn = this.app.i18n.datePlus(Date.now(), { seconds: expiresInSeconds });

        const options = {
            expiresOn,
            permissions,
            ...payload,
        };

        return blockBlobClient.generateSasUrl(options);
    }
}

export default AzureService;
