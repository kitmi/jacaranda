"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    hash: function() {
        return hash;
    },
    hashFile_: function() {
        return hashFile_;
    }
});
const _nodecrypto = /*#__PURE__*/ _interop_require_default(require("node:crypto"));
const _nodefs = require("node:fs");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function hash(hashAlgorithm, message, salt, encoding = 'hex') {
    const hash = _nodecrypto.default.createHash(hashAlgorithm);
    hash.update(message);
    if (salt != null) {
        hash.update(salt);
    }
    return hash.digest(encoding);
}
async function hashFile_(hashAlgorithm, filePath, encoding = 'hex') {
    const hash = _nodecrypto.default.createHash(hashAlgorithm);
    return new Promise((resolve, reject)=>(0, _nodefs.createReadStream)(filePath).on('error', reject).pipe(hash).on('error', reject).on('finish', ()=>{
            if (encoding === 'buffer') {
                const { buffer } = new Uint8Array(hash.read());
                resolve(buffer);
            } else {
                resolve(hash.read().toString(encoding));
            }
        }));
}

//# sourceMappingURL=hash.js.map