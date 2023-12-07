import fs from 'fs-extra';

/**
 * Is the path a directory?
 * @function module:fs.isDir
 * @param {String} path 
 * @returns {boolean}
 */
export const isDir = (path) => fs.statSync(path).isDirectory();

/**
 * Is the path a directory? (async)
 * @function module:fs.isDir_
 * @param {String} path 
 * @returns {boolean}
 */
export const isDir_ = async (path) => (await fs.stat(path)).isDirectory();

/**
 * Is the path an empty directory?
 * @function module:fs.isDirEmpty
 * @param {String} path
 * @returns {boolean}
 */
export const isDirEmpty = (path) => fs.readdirSync(path).length === 0;

/**
 * Is the path an empty directory? (async)
 * @function module:fs.isDirEmpty_
 * @param {String} path
 * @returns {boolean}
 */
export const isDirEmpty_ = async (path) => {
    const files = await fs.readdir(path);
    return files.length === 0;
};

