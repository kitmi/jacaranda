import { cmd } from '@kitmi/sys'

const pnpmPackageManager = {
    async addPackage_(packageName) {
        await cmd.runLive_('pnpm', ['add', packageName]);
    }
}

export default pnpmPackageManager;