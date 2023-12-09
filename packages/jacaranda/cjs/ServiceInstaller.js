"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _adapters = require("@kitmi/adapters");
const _utils = require("@kitmi/utils");
const _ServiceContainer = /*#__PURE__*/ _interop_require_default(require("./ServiceContainer"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Service dependencies installer.
 * @class
 */ class ServiceInstaller extends _ServiceContainer.default {
    async _loadFeatureGroup_(featureGroup, groupStage) {
        const npm = _adapters.packageManagers[this.options.packageManager];
        featureGroup = this._sortFeatures(featureGroup);
        await this.emit_('before:' + groupStage);
        this.log('verbose', `Installing dependencies for "${groupStage}" feature group ...`);
        let counter = 0;
        await (0, _utils.eachAsync_)(featureGroup, async ([feature])=>{
            const { name, depends } = feature;
            await this.emit_('before:load:' + name);
            this.log('verbose', `Installing dependencies for feature "${name}" ...`);
            depends && this._dependsOn(depends, name);
            const requiredPackages = feature.packages ?? [];
            await (0, _utils.eachAsync_)(requiredPackages, (pkg)=>npm.addPackage_(pkg));
            this.features[name].enabled = true;
            if (requiredPackages.length > 0) {
                this.log('verbose', `Dependencies of feature "${name}" are installed. [${requiredPackages.length}]`);
            } else {
                this.log('verbose', `No dependencies found for feature "${name}". [SKIP]`);
            }
            await this.emit_('after:load:' + name);
            counter += requiredPackages.length;
        });
        if (counter > 0) {
            this.log('verbose', `Finished installation of dependencies for "${groupStage}" feature group. [${counter}]`);
        } else {
            this.log('verbose', `No dependencies found for "${groupStage}" feature group. [SKIP]`);
        }
        await this.emit_('after:' + groupStage);
    }
}
const _default = ServiceInstaller;

//# sourceMappingURL=ServiceInstaller.js.map