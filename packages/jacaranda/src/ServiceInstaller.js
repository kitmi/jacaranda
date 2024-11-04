import { packageManagers } from '@kitmi/adapters';
import { eachAsync_ } from '@kitmi/utils';
import ServiceContainer from './ServiceContainer';

/**
 * Service dependencies installer.
 * @class
 */
class ServiceInstaller extends ServiceContainer {
    async _loadFeatureGroup_(featureGroup, groupStage) {
        const npm = packageManagers[this.options.packageManager];

        featureGroup = this._sortFeatures(featureGroup);

        await this.emit_('before:' + groupStage);
        this.log('info', `Installing dependencies for "${groupStage}" feature group ...`);

        let counter = 0;

        await eachAsync_(featureGroup, async ([feature, options]) => {
            const { name, depends } = feature;
            await this.emit_('before:load:' + name);
            this.log('info', `Installing dependencies for feature "${name}" ...`);

            depends && this._dependsOn(depends, name);

            const requiredPackages = feature.packages
                ? typeof feature.packages === 'function'
                    ? feature.packages(options)
                    : feature.packages
                : [];
            if (this.options.dryRun) {
                this.log('info', `Detected dependencies: [${requiredPackages.join(', ')}]`);
            } else {
                await eachAsync_(requiredPackages, (pkg) => npm.addPackage_(pkg));
            }

            this.features[name].enabled = true;
            if (requiredPackages.length > 0) {
                this.log('info', `Dependencies of feature "${name}" are installed. [${requiredPackages.length}]`);
            } else {
                this.log('info', `No dependencies found for feature "${name}". [SKIP]`);
            }

            await this.emit_('after:load:' + name);

            counter += requiredPackages.length;
        });

        if (counter > 0) {
            this.log('info', `Finished installation of dependencies for "${groupStage}" feature group. [${counter}]`);
        } else {
            this.log('info', `No dependencies found for "${groupStage}" feature group. [SKIP]`);
        }

        await this.emit_('after:' + groupStage);
    }
}

export default ServiceInstaller;
