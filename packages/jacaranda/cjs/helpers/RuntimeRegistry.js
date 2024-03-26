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
const _utils = require("@kitmi/utils");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * @class
 */ class RuntimeRegistry {
    /**
     * Get a runtime module.
     * @param {string} [ns] - The namespace of the module.
     * @param {string} moduleName
     * @returns {object}
     */ get(...args) {
        let [ns, moduleName] = (0, _utils.fxargs)(args, [
            'string?',
            'string'
        ]);
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
     */ register(...args) {
        let [ns, moduleName, loadedModule, asDefaultOnly] = (0, _utils.fxargs)(args, [
            'string?',
            'string',
            'object|function',
            'boolean?'
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
    constructor(){
        _define_property(this, "modulesRegistry", {});
    }
}
const _default = RuntimeRegistry;

//# sourceMappingURL=RuntimeRegistry.js.map