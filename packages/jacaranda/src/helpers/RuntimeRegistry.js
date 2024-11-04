import { fxargs } from '@kitmi/utils';

/**
 * @class
 */
class RuntimeRegistry {
    modulesRegistry = {};

    /**
     * Get a runtime module.
     * @param {string} [ns] - The namespace of the module.
     * @param {string} moduleName
     * @returns {object}
     */
    get(...args) {
        let [ns, moduleName] = fxargs(args, ['string?', 'string']);
        if (ns != null) {
            moduleName = `${ns}:${moduleName}`;
        }

        return this.modulesRegistry[moduleName];
    }

    /**
     * Register a runtime module.
     * @param {string} [ns] - The namespace of the module.
     * @param {string} moduleName - The name of the module.
     * @param {object} loadedModule - The loaded module.
     * @param {boolean} [asDefaultOnly] - Whether to register as default only.
     * @returns {RuntimeRegistry}
     */
    register(...args) {
        let [ns, moduleName, loadedModule, asDefaultOnly] = fxargs(args, [
            'string?',
            'string',
            'object|function|string',
            'boolean?',
        ]);
        if (ns != null) {
            moduleName = `${ns}:${moduleName}`;
        }

        const exists = moduleName in this.modulesRegistry;

        if (!asDefaultOnly && exists) {
            throw new Error(`Module "${moduleName}" already exists.`);
        }

        if (!exists) {
            this.modulesRegistry[moduleName] = loadedModule;
        }

        return this;
    }

    /**
     * Deregister a runtime module.
     * @param {string} [ns] - The namespace of the module.
     * @param {string} moduleName - The name of the module.
     */
    deregister(...args) {
        let [ns, moduleName] = fxargs(args, ['string?', 'string']);
        if (ns != null) {
            moduleName = `${ns}:${moduleName}`;
        }

        delete this.modulesRegistry[moduleName];
    }
}

export default RuntimeRegistry;
