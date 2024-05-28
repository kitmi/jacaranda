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
const _hash = require("./utils/hash");
const _crypto = require("./utils/crypto");
const _jacaranda = require("@kitmi/jacaranda");
const hashes = [
    'rsa-md5',
    'rsa-ripemd160',
    'rsa-sha1',
    'rsa-sha1-2',
    'rsa-sha224',
    'rsa-sha256',
    'rsa-sha3-224',
    'rsa-sha3-256',
    'rsa-sha3-384',
    'rsa-sha3-512',
    'rsa-sha384',
    'rsa-sha512',
    'rsa-sha512/224',
    'rsa-sha512/256',
    'rsa-sm3',
    'blake2b512',
    'blake2s256',
    'id-rsassa-pkcs1-v1_5-with-sha3-224',
    'id-rsassa-pkcs1-v1_5-with-sha3-256',
    'id-rsassa-pkcs1-v1_5-with-sha3-384',
    'id-rsassa-pkcs1-v1_5-with-sha3-512',
    'md5',
    'md5-sha1',
    'md5withrsaencryption',
    'ripemd',
    'ripemd160',
    'ripemd160withrsa',
    'rmd160',
    'sha1',
    'sha1withrsaencryption',
    'sha224',
    'sha224withrsaencryption',
    'sha256',
    'sha256withrsaencryption',
    'sha3-224',
    'sha3-256',
    'sha3-384',
    'sha3-512',
    'sha384',
    'sha384withrsaencryption',
    'sha512',
    'sha512-224',
    'sha512-224withrsaencryption',
    'sha512-256',
    'sha512-256withrsaencryption',
    'sha512withrsaencryption',
    'shake128',
    'shake256',
    'sm3',
    'sm3withrsaencryption',
    'ssl3-md5',
    'ssl3-sha1'
];
const _default = {
    stage: _jacaranda.Feature.SERVICE,
    groupable: true,
    load_: async function(app, options, name) {
        const { hashAlgorithm, cipherAlgorithm, key, keyPairType, asymmetricBits, signerAlgorithm } = app.featureConfig(options, {
            schema: {
                key: {
                    type: 'text',
                    optional: true
                },
                hashAlgorithm: {
                    type: 'text',
                    enum: hashes,
                    optional: true,
                    default: 'sha256'
                },
                cipherAlgorithm: {
                    type: 'text',
                    optional: true,
                    default: 'aes-256-cbc'
                },
                keyPairType: {
                    type: 'text',
                    enum: [
                        'rsa',
                        'rsa-pss',
                        'dsa',
                        'ec',
                        'ed25519',
                        'ed448',
                        'x25519',
                        'x448',
                        'dh'
                    ],
                    optional: true,
                    default: 'rsa'
                },
                asymmetricBits: {
                    type: 'integer',
                    optional: true,
                    default: 2048
                },
                signerAlgorithm: {
                    type: 'text',
                    enum: hashes,
                    optional: true,
                    default: 'rsa-sha256'
                }
            }
        }, name);
        const service = {
            hash: (message, salt, encoding = 'hex', _hashAlgorithm)=>(0, _hash.hash)(_hashAlgorithm ?? hashAlgorithm, message, salt, encoding),
            hashFile_: (filePath, encoding = 'hex', _hashAlgorithm)=>(0, _hash.hashFile_)(_hashAlgorithm ?? hashAlgorithm, filePath, encoding),
            encrypt: (message, _key, _cipherAlgorithm)=>(0, _crypto.encrypt)(_cipherAlgorithm ?? cipherAlgorithm, _key ?? key, message),
            decrypt: (message, _key, _cipherAlgorithm)=>(0, _crypto.decrypt)(_cipherAlgorithm ?? cipherAlgorithm, _key ?? key, message),
            generateKeyPair: (type, _options)=>(0, _crypto.generateKeyPair)(type ?? keyPairType, asymmetricBits, _options),
            generateKeyPair_: async (type, _options)=>(0, _crypto.generateKeyPair_)(type ?? keyPairType, asymmetricBits, _options),
            publicEncrypt: (message, publicKey, encoding = 'base64')=>(0, _crypto.publicEncrypt)(publicKey, message, encoding),
            privateDecrypt: (message, privateKey, encoding = 'base64')=>(0, _crypto.privateDecrypt)(privateKey, message, encoding),
            privateSign: (message, privateKey, _signerAlgorithm, encoding = 'base64')=>(0, _crypto.privateSign)(_signerAlgorithm ?? signerAlgorithm, privateKey, message, encoding),
            publicVerify: (message, signature, publicKey, _signerAlgorithm, encoding = 'base64')=>(0, _crypto.publicVerify)(_signerAlgorithm ?? signerAlgorithm, publicKey, message, signature, encoding)
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=cipher.js.map