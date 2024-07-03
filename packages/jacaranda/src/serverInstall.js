import ServiceInstaller from './ServiceInstaller';
import Runnable from './Runnable';
import { createWebServer } from './WebServer';

const ServerInstaller = createWebServer(Runnable(ServiceInstaller));

/**
 * Installer for web server.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceInstaller}
 */
class Installer extends ServerInstaller {
    constructor(options) {
        super('installer', options);
    }
}

function install(options) {
    const installer = new Installer(options);

    installer
        .start_()
        .then((app) => app.stop_())
        .catch((err) => {
            // eslint-disable-next-line no-undef
            console.error(err);
        });
}

export default install;
