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
const _featcipher = require("@kitmi/feat-cipher");
async function hashFile(step, settings) {
    let { algorithm, file } = _allSync.Types.OBJECT.sanitize(settings, {
        schema: {
            algorithm: {
                type: 'text'
            },
            file: {
                type: 'text'
            }
        }
    });
    algorithm = step.getValue(algorithm);
    const filePath = step.getValue(file);
    const digest = await (0, _featcipher.hashFile_)(algorithm, filePath);
    step.syslog('info', `File "${filePath}" hashed with "${algorithm}" algorithm.`, {
        digest
    });
    return digest;
}

//# sourceMappingURL=hashFile.js.map