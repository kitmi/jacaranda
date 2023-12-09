import ServiceInstaller from './ServiceInstaller';
import Runnable from './Runnable';

/**
 * Installer cli.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceInstaller}
 */
class Installer extends Runnable(ServiceInstaller) {
    constructor(name, options) {
        super(name || 'installer', options);
    }
}

function install(options) {
    const installer = new Installer(null, options);

    installer
        .start_()
        .then((app) => app.stop_())
        .catch((err) => {
            console.error(err);
        });
}

export default install;
