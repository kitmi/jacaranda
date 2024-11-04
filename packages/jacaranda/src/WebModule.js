import { _, text } from '@kitmi/utils';
import ServiceContainer from './ServiceContainer';
import ModuleBase from './ModuleBase';
import Routable from './Routable';

/**
 * Web application module class.
 * @class
 * @extends ModuleBase(Routable(ServiceContainer))
 */
class WebModule extends ModuleBase(Routable(ServiceContainer)) {
    /**
     * @param {WebServer} server
     * @param {string} name - The name of the app module.
     * @param {string} route - The base route of the app module.
     * @param {string} appPath - The path to load the app's module files
     * @param {object} [options] - The app module's extra options defined in its parent's configuration.
     */
    constructor(server, name, route, appPath, options) {
        super(server, name, appPath, options);

        this.server = this.host;
        this.router = this.server.engine.createModuleRouter(this);

        /**
         * Mounting route.
         * @member {string}
         */
        this.route = text.ensureStartsWith(text.dropIfEndsWith(route, '/'), '/');
    }
}

export default WebModule;
