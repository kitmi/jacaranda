import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';

export function hash(hashAlgorithm, message, salt, encoding = 'hex') {
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(message);
    if (salt != null) {
        hash.update(salt);
    }

    return hash.digest(encoding);
};

export async function hashFile_(hashAlgorithm, filePath, encoding = 'hex') {
    const hash = crypto.createHash(hashAlgorithm);
    return new Promise((resolve, reject) =>
        createReadStream(filePath)
            .on('error', reject)
            .pipe(hash)
            .on('error', reject)
            .on('finish', () => {
                if (encoding === 'buffer') {
                    const { buffer } = new Uint8Array(hash.read());
                    resolve(buffer);
                } else {
                    resolve(hash.read().toString(encoding));
                }
            })
    );
};

