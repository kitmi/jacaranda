const pipeAsync_ = (stream1, stream2) =>
    new Promise((resolve, reject) => {
        stream2.on('close', resolve);
        stream2.on('error', reject);
        stream1.pipe(stream2);
    });

export default pipeAsync_;
