import { createRequire } from 'node:module';
import path from 'node:path';

function tryRequireBy(packageName, mainModule, throwWhenNotFound) {
    try {
        const require2 = createRequire(
            mainModule.endsWith('/') || mainModule.endsWith('\\') ? mainModule : mainModule + path.sep
        );

        return require2(packageName);
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            if (throwWhenNotFound) {
                let pkgPaths = packageName.split('/');
                let npmPkgName = pkgPaths[0];

                if (npmPkgName.startsWith('.')) {
                    //path
                    throw error;
                }

                throw error;
            }

            return undefined;
        }

        throw error;
    }
}

/**
 * Try require a package module and show install tips if not found.
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

    if (packageName.startsWith('@') || path.isAbsolute(packageName)) {
        try {
            return require(packageName);
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }            
        }
    }

    basePath != null || (basePath = process.cwd());

    return tryRequireBy(packageName, basePath, true);
}

export default tryRequire;
