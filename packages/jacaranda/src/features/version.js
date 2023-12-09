/**
 * Set app version
 * @module Feature_Version
 */

import { fs } from '@kitmi/sys';
import Feature from '../Feature';

export default {
    /**
     * This feature is loaded at init stage
     * @member {string}
     */
    stage: Feature.INIT,

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {string} version - Version information, use '@@package' to use the version info from package.json located under working folder
     * @returns {Promise.<*>}
     */
    load_: async function (app, version) {
        if (version === '@@package') {
            let pkgFile = app.toAbsolutePath('package.json');
            if (!(await fs.exists(pkgFile))) {
                throw new Error('"package.json" not found in working directory. CWD: ' + app.workingPath);
            }

            let pkg = await fs.readJson(pkgFile);
            version = pkg.version;
        }

        app.version = version;
    },
};
