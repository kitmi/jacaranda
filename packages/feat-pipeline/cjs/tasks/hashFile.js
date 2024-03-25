"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return hashFile;
    }
});
const _hash = require("@kitmi/jacaranda/features/utils/hash");
async function hashFile(step, settings) {
    const { algorithm = 'md5', file } = settings;
    const filePath = step.getValue(file);
    const digest = await (0, _hash.hashFile_)(algorithm, filePath);
    step.stepLog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest
    });
    return digest;
}

//# sourceMappingURL=hashFile.js.map