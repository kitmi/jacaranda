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
    decrypt: function() {
        return decrypt;
    },
    encrypt: function() {
        return encrypt;
    },
    generateKeyPair: function() {
        return generateKeyPair;
    },
    generateKeyPair_: function() {
        return generateKeyPair_;
    },
    privateDecrypt: function() {
        return privateDecrypt;
    },
    privateSign: function() {
        return privateSign;
    },
    publicEncrypt: function() {
        return publicEncrypt;
    },
    publicVerify: function() {
        return publicVerify;
    }
});
const _nodecrypto = /*#__PURE__*/ _interop_require_default(require("node:crypto"));
const _types = require("@kitmi/types");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const encrypt = (cipherAlgorithm, key, message)=>{
    if (!key || key.length !== 32) {
        throw new _types.ValidationError('The length of symmetric key should be exactly 32.', {
            key
        });
    }
    const buf = Buffer.alloc(16);
    _nodecrypto.default.randomFillSync(buf);
    const cipher = _nodecrypto.default.createCipheriv(cipherAlgorithm, key, buf);
    let encryptedData = cipher.update(message, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    encryptedData += buf.toString('hex');
    return encryptedData;
};
const decrypt = (cipherAlgorithm, key, message)=>{
    if (!key || key.length !== 32) {
        throw new _types.ValidationError('The length of symmetric key should be exactly 32.', {
            key
        });
    }
    const l = message.length - 32;
    const iv = Buffer.from(message.substring(l), 'hex');
    const encrypted = message.substring(0, l);
    const decipher = _nodecrypto.default.createDecipheriv(cipherAlgorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
const generateKeyPair = (keyPairType, asymmetricBits, options)=>{
    const keypair = _nodecrypto.default.generateKeyPairSync(keyPairType, {
        modulusLength: asymmetricBits,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        },
        ...options
    });
    return keypair;
};
const generateKeyPair_ = async (keyPairType, asymmetricBits, options)=>{
    const keypair = await new Promise((resolve, reject)=>_nodecrypto.default.generateKeyPair(keyPairType, {
            modulusLength: asymmetricBits,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            },
            ...options
        }, (err, publicKey, privateKey)=>{
            if (err) {
                reject(err);
                return;
            }
            resolve({
                publicKey,
                privateKey
            });
        }));
    return keypair;
};
const publicEncrypt = (publicKey, message, encoding = 'base64')=>{
    return _nodecrypto.default.publicEncrypt(publicKey, Buffer.from(message, 'utf8')).toString(encoding);
};
const privateDecrypt = (privateKey, message, encoding = 'base64')=>{
    return _nodecrypto.default.privateDecrypt(privateKey, Buffer.from(message, encoding)).toString('utf8');
};
const privateSign = (signerAlgorithm, privateKey, message, encoding = 'base64')=>{
    const signer = _nodecrypto.default.createSign(signerAlgorithm);
    signer.update(message);
    return signer.sign(privateKey, encoding);
};
const publicVerify = (signerAlgorithm, publicKey, message, signature, encoding = 'base64')=>{
    const verifier = _nodecrypto.default.createVerify(signerAlgorithm);
    verifier.update(message);
    return verifier.verify(publicKey, signature, encoding);
};

//# sourceMappingURL=crypto.js.map