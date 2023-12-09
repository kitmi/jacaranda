import crypto from 'node:crypto';
import { ValidationError } from '@kitmi/types';

export const encrypt = (cipherAlgorithm, key, message) => {
    if (!key || key.length !== 32) {
        throw new ValidationError('The length of symmetric key should be exactly 32.', {
            key,
        });
    }

    const buf = Buffer.alloc(16);
    crypto.randomFillSync(buf);

    const cipher = crypto.createCipheriv(cipherAlgorithm, key, buf);

    let encryptedData = cipher.update(message, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    encryptedData += buf.toString('hex');
    return encryptedData;
};

export const decrypt = (cipherAlgorithm, key, message) => {
    if (!key || key.length !== 32) {
        throw new ValidationError('The length of symmetric key should be exactly 32.', {
            key,
        });
    }

    const l = message.length - 32;
    const iv = Buffer.from(message.substring(l), 'hex');

    const encrypted = message.substring(0, l);

    const decipher = crypto.createDecipheriv(cipherAlgorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const generateKeyPair = (keyPairType, asymmetricBits, options) => {
    const keypair = crypto.generateKeyPairSync(keyPairType, {
        modulusLength: asymmetricBits,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
        ...options,
    });

    return keypair;
};

export const generateKeyPair_ = async (keyPairType, asymmetricBits, options) => {
    const keypair = await new Promise((resolve, reject) =>
        crypto.generateKeyPair(
            keyPairType,
            {
                modulusLength: asymmetricBits,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                },
                ...options,
            },
            (err, publicKey, privateKey) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({ publicKey, privateKey });
            }
        )
    );

    return keypair;
};

export const publicEncrypt = (publicKey, message, encoding = 'base64') => {
    return crypto.publicEncrypt(publicKey, Buffer.from(message, 'utf8')).toString(encoding);
};

export const privateDecrypt = (privateKey, message, encoding = 'base64') => {
    return crypto.privateDecrypt(privateKey, Buffer.from(message, encoding)).toString('utf8');
};

export const privateSign = (signerAlgorithm, privateKey, message, encoding = 'base64') => {
    const signer = crypto.createSign(signerAlgorithm);
    signer.update(message);

    return signer.sign(privateKey, encoding);
};

export const publicVerify = (signerAlgorithm, publicKey, message, signature, encoding = 'base64') => {
    const verifier = crypto.createVerify(signerAlgorithm);
    verifier.update(message);

    return verifier.verify(publicKey, signature, encoding);
};