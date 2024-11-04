import isPromise from "./isPromise";

const pipeAsync_ = async (readStream, writeStream) => {
    isPromise(readStream) && (readStream = await readStream);

    // eslint-disable-next-line no-undef
    if (readStream instanceof ReadableStream && !(writeStream instanceof WritableStream)) {
        writeStream = writeStream.constructor.toWeb(writeStream);
        return readStream.pipeTo(writeStream);
    } 

    return new Promise((resolve, reject) => {
        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
    });
}

export default pipeAsync_;