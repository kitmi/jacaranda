"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
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
class AzureService {
    async getUploadUrl_(...args) {
        const [objectKey, contentType, expiresInSeconds = _common.DEFAULT_UPLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'string',
            'integer?',
            'object?'
        ]);
        const blockBlobClient = this.client.getBlockBlobClient(objectKey);
        const permissions = this.createBlobSASPermissions();
        permissions.create = true;
        permissions.write = true;
        const expiresOn = this.app.now().plus({
            seconds: expiresInSeconds
        }).toJSDate();
        const options = {
            expiresOn,
            permissions,
            contentType,
            ...payload
        };
        return blockBlobClient.generateSasUrl(options);
    }
    async getDownloadUrl_(...args) {
        const [objectKey, expiresInSeconds = _common.DEFAULT_DOWNLOAD_EXPIRY, payload] = (0, _utils.fxargs)(args, [
            'string',
            'integer?',
            'object?'
        ]);
        const blockBlobClient = this.client.getBlockBlobClient(objectKey);
        const permissions = this.createBlobSASPermissions();
        permissions.read = true;
        const expiresOn = this.app.now().plus({
            seconds: expiresInSeconds
        }).toJSDate();
        const options = {
            expiresOn,
            permissions,
            ...payload
        };
        return blockBlobClient.generateSasUrl(options);
    }
    constructor(app, options){
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
        this.createBlobSASPermissions = ()=>new BlobSASPermissions();
    }
}
_define_property(AzureService, "packages", [
    '@azure/storage-blob'
]);
module.exports = AzureService;

//# sourceMappingURL=Azure.js.map