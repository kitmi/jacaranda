import { cmd } from '@kitmi/sys';

const npmPackageManager = {
    async addPackage_(packageName) {
        await cmd.runLive_('npm', ['install', packageName]);
    },
};

export default npmPackageManager;
