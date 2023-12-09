import { cmd } from '@kitmi/sys'

const yarnPackageManager = {
    async addPackage(packageName) {
        await cmd.runLive_('yarn', ['add', packageName]);
    }
}

export default yarnPackageManager;