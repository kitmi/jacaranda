import fs from 'fs-extra';
import os from 'node:os'; 
import path from 'node:path';

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

/**
 * Read a file list.
 * @param {string} basePath - Base path to resolve of files in the list
 * @param {string} listFile - List file path
 * @param {string} [eol = os.EOL] 
 * @returns {array}
 */
export const readFileList_ = async (basePath, listFile, eol) => {
    const fileList = await fs.readFile(listFile, 'utf-8');
    const list = fileList
        .split(eol ?? os.EOL);

    return list.reduce((acc, file) => {
        if (file.startsWith('#')) {
            return acc;
        }

        file = file.trim();

        if (file.length === 0) {
            return acc;
        }        

        return [...acc, path.resolve(basePath, file)];
    }, []);        
};
