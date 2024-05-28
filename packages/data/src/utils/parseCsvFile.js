const { fs, tryRequire } = require('@genx/sys');

module.exports = async (csvFile, options, transformer) => {
    const csv = tryRequire('fast-csv');

    const readStream = fs.createReadStream(csvFile);
    const parser = csv.parse({
        headers: true,
        trim: true,
        ...options,
    });

    let transformWithCallback, output;

    if (transformer) {
        let line = 0;
        transformWithCallback = (data, callback) =>
            transformer(data, line++)
                .then((result) => callback(null, result))
                .catch((error) => callback(error));
    } else {
        output = [];
    }

    return new Promise((resolve, reject) => {
        if (!transformWithCallback) {
            readStream.pipe(
                parser
                    .on('error', reject)
                    .on('data', (record) => output.push(record))
                    .on('end', () => resolve(output))
            );
        } else {
            readStream.pipe(
                parser
                    .transform(transformWithCallback)
                    .on('error', reject)
                    .on('data', (row) => {})
                    .on('end', () => resolve())
            );
        }
    });
};
