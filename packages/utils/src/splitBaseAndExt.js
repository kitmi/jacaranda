/**
 * Split the base and extension (including the ".") of a file path.
 * @param {*} filePath
 * @returns (array) [base, ext]
 */
const splitBaseAndExt = (filePath) => {
    const pos = filePath.lastIndexOf('.');
    return [pos === -1 ? filePath : filePath.substring(0, pos), pos === -1 ? '' : filePath.substring(pos)];
};

export default splitBaseAndExt;
