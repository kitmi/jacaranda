import path from 'node:path';
import { _, batchAsync_, isPlainObject } from '@kitmi/utils';
import { InvalidConfiguration } from '@kitmi/types';
import Runnable from './Runnable';
import Routable from './Routable';
import ServiceContainer from './ServiceContainer';
import defaultServerOpts from './defaultServerOpts';

/**
 * Web server class.
 * @class
 * @extends Routable(App)
 */
class WebServer extends Routable(Runnable(ServiceContainer)) {
    /**
     * @param {string} [name='server'] - The name of the server.
     * @param {object} [options] - The app module's extra options defined in its parent's configuration.
     * @property {object} [options.logger] - Logger options
     * @property {bool} [options.verbose=false] - Flag to output trivial information for diagnostics
     * @property {string} [options.env] - Environment, default to process.env.NODE_ENV
     * @property {string} [options.workingPath] - App's working path, default to process.cwd()
     * @property {string} [options.configPath] - App's config path, default to "conf" under workingPath
     * @property {string} [options.configName] - App's config basename, default to "app"
     * @property {string} [options.sourcePath='server'] - Relative path of back-end server source files
     * @property {string} [options.appModulesPath=app_modules] - Relative path of child modules
     */
    constructor(name, options) {
        if (typeof options === 'undefined' && isPlainObject(name)) {
            options = name;
            name = undefined;
        }

        super(name || 'server', {
            ...defaultServerOpts,
            ...options,
        });

        /**
         * Hosting server.
         * @member {WebServer}
         **/
        this.server = this;

        /**
         * Whether it is a server.
         * @member {boolean}
         **/
        this.isServer = true;

        /**
         * App modules path.
         * @member {string}
         */
        this.appModulesPath = this.toAbsolutePath(this.options.appModulesPath);

        /**
         * Base route.
         * @member {string}
         */
        this.route = '/';

        // register built-in middlewares
        this.addMiddlewaresRegistryFrom(path.resolve(__dirname, 'middlewares'));

        this.once('after:Initial', () => {
            if (this.engine == null) {
                throw new InvalidConfiguration('Missing server engine feature, e.g. koa or hono.', this);
            }
        });
    }

    async stop_() {
        let stopByThis = false;

        if (this.started) {
            stopByThis = true;

            if (this.appModules) {
                await batchAsync_(this.appModules, (app) => app.stop_());
                delete this.appModules;
                delete this.appModulesByAlias;
            }
        }

        if (stopByThis && this.httpServer) {
            await new Promise((resolve, reject) => {
                this.httpServer.close((err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            delete this.httpServer;
            this.log('info', `The http service is stopped.`);
        }

        return super.stop_();
    }

    visitChildModules(vistor) {
        super.visitChildModules(vistor);

        if (this.appModules) {
            _.each(this.appModules, vistor);
        }
    }

    getExports() {
        return this._stuffToExport;
    }

    /**
     * Mount an app at specified route.
     * @param {WebModule} app
     */
    mountApp(app) {
        if (!this.appModules) {
            this.appModules = {};
            this.appModulesByAlias = {};
        }

        if (app.route in this.appModules) {
            throw new Error(`The route "${app.route}" is already mounted by another app.`);
        }

        this.engine.mount(app.route, app.router);

        this.appModules[app.route] = app;

        if (app.name in this.appModulesByAlias) {
            let existingApp = this.appModulesByAlias[app.name];
            //move bucket
            this.appModulesByAlias[`${existingApp.name}[@${existingApp.route}]`] = existingApp;
            delete this.appModulesByAlias[app.name];

            this.appModulesByAlias[`${app.name}[@${app.route}]`] = app;
        } else {
            this.appModulesByAlias[app.name] = app;
        }

        this.log('verbose', `All routes from app [${app.name}] are mounted under "${app.route}".`);
    }

    /**
     * Get the app module object by base route
     * @param {string} p - App module base route started with "/"
     */
    getAppByRoute(p) {
        return this.appModules[p];
    }

    /**
     * Get the app module object by app alias, usually the app name if no duplicate entry
     * @param {string} a - App module alias
     */
    getAppByAlias(a) {
        return this.appModulesByAlias[a];
    }

    /**
     * Require a js module from backend path
     * @param {*} relativePath
     */
    require(relativePath) {
        let modPath = path.join(this.sourcePath, relativePath);
        return require(modPath);
    }

    /**
     * Require a module from the source path of an app module
     * @param {*} relativePath
     */
    requireFromApp(appName, relativePath) {
        const app = this.getAppByAlias(appName);
        return app.require(relativePath);
    }

    /**
     * Get a registered service
     * @param {string} name
     *
     * @example
     *  // Get service from a lib module
     *  const service = app.getService('<lib name>/<service name>');
     *  // e.g const service = app.getService('data/mysql.mydb');
     *
     *  // Get service from a web app module
     *  const service = app.getService('<app name>:<service name>');
     *  // e.g const service = app.getService('admin:mysql.mydb');
     */
    getService(name) {
        let pos = name.indexOf(':');
        if (pos === -1) {
            return super.getService(name);
        }

        let modAlias = name.substring(0, pos);
        name = name.substring(pos + 1);

        let app = this.getAppByAlias(modAlias);
        return app && app.getService(name, true);
    }

    _getFeatureFallbackPath() {
        let pathArray = super._getFeatureFallbackPath();
        pathArray.splice(1, 0, path.resolve(__dirname, 'serverFeatures'));

        return pathArray;
    }
}

export default WebServer;
