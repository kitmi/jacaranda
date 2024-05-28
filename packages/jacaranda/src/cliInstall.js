import ServiceInstaller from './ServiceInstaller';
import Runnable from './Runnable';

/**
 * Installer for cli app.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceInstaller}
 */
class Installer extends Runnable(ServiceInstaller) {
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
            console.error(err);
        });
}

export default install;
