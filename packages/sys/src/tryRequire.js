import requireFrom from './requireFrom';
import path from 'node:path';

/**
 * Try require a package module directly or fallback to normal require logic with the starting point of current working folder.
 * @alias helpers.tryRequire
 * @param {String} packageName
 * @param {String} [basePath] - Base path to find the module
 * @returns {Object}
 */
function tryRequire(packageName, basePath) {
    // relative path
    const isRelative = packageName.indexOf(path.sep) > 0 && packageName.startsWith('.');
    if (isRelative) {
        packageName = path.resolve(basePath ?? '', packageName);
    }

    if (packageName.startsWith('@') || !isRelative) {
        try {
            return require(packageName);
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }            
        }
    }

    basePath != null || (basePath = process.cwd());

    return requireFrom(packageName, basePath);
}

export default tryRequire;
