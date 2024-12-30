import path from 'node:path';

const ModuleBase = (Base) =>
    class extends Base {
        /**
         * @param {Runnable} hostApp
         * @param {string} name - The name of the app module.
         * @param {string} route - The base route of the app module.
         * @param {string} appPath - The path to load the app's module files
         * @param {object} [options] - The app module's extra options defined in its parent's configuration.
         */
        constructor(hostApp, name, appPath, options) {
            super(name, {
                workingPath: appPath,
                configPath: path.join(appPath, 'conf'),
                sourcePath: hostApp.isEsm ? './src' : './cjs',
                ...options,
            });

            /**
             * Hosting app.
             * @member {Runnable}
             **/
            this.host = hostApp;

            /**
             * Whether it is a server.
             * @member {boolean}
             **/
            this.isServer = false;
            this.isModule = true;

            this.featuresPath = path.resolve(this.sourcePath, this.options.featuresPath);

            this.logger = this.host.logger.child({ module: this.name }, { level: this.options.logLevel });
        }

        get i18n() {
            return this.host.i18n;
        }

        /**
         * Get a service from module hierarchy
         * @param name
         * @returns {object}
         */
        getService(name, currentModuleOnly) {
            return super.getService(name) || (!currentModuleOnly && this.host.getService(name));
        }

        /**
         * Check whether a service exists
         * @param {*} name
         * @returns {boolean}
         */
        hasService(name, currentModuleOnly) {
            return super.hasService(name) || (!currentModuleOnly && this.host.hasService(name));
        }

        /**
         * Check whether a feature is enabled in the app or its hosting server.
         * @param {string} feature
         * @returns {bool}
         */
        enabled(feature, currentModuleOnly) {
            return super.enabled(feature) || (!currentModuleOnly && this.host.enabled(feature));
        }
    };

export default ModuleBase;
