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
const _allSync = require("@kitmi/validators/allSync");
const _hash = require("@kitmi/jacaranda/features/utils/hash");
async function hashFile(step, settings) {
    let { algorithm, file } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            algorithm: {
                type: 'text',
                optional: true,
                default: 'md5'
            },
            file: {
                type: 'text'
            }
        }
    });
    const filePath = step.getValue(file);
    const digest = await (0, _hash.hashFile_)(algorithm, filePath);
    step.stepLog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest
    });
    return digest;
}

//# sourceMappingURL=hashFile.js.map