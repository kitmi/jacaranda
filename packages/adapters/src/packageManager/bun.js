import { cmd } from '@kitmi/sys'

const bunPackageManager = {
    async addPackage_(packageName) {
        await cmd.runLive_('bun', ['add', packageName]);
    }
}

export default bunPackageManager;