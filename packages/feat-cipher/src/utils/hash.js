import crypto from 'node:crypto';
import fs, { createReadStream } from 'node:fs';
import path from 'node:path';
const { pipeline } = require('node:stream/promises');

export function hash(hashAlgorithm, message, salt, encoding = 'hex') {
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(message);
    if (salt != null) {
        hash.update(salt);
    }

    return hash.digest(encoding);
}

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
}

export async function hashFiles_(hashAlgorithm, basePath, files, encoding = 'hex', ignoreUnexist = true) {
    const hash = crypto.createHash(hashAlgorithm);

    for (const file of files) {
        const filePath = basePath ? path.resolve(basePath, file) : path.resolve(file);

        // Check if the file exists
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
        } catch (error) {
            if (ignoreUnexist) {
                continue;
            }

            throw new Error(`File does not exist: ${filePath}`);
        }

        // Create a read stream for the file
        const readStream = fs.createReadStream(filePath);

        // Use pipeline to handle the streaming and cleanup
        await pipeline(readStream, async function* (source) {
            for await (const chunk of source) {
                hash.update(chunk);
                yield chunk;
            }
        });
    }

    if (encoding === 'buffer') {        
        return hash.digest();
    }

    return hash.digest(encoding);
}
