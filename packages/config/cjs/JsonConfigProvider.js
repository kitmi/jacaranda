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
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _promises = require("node:fs/promises");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class JsonConfigProvider {
    parse(fileContent) {
        return JSON.parse(fileContent);
    }
    stringify() {
        return JSON.stringify(this.config ?? {}, null, 4);
    }
    /**
     * Start loading the config files
     * @returns {Promise.<object>}
     */ async load_(logger, noThrow) {
        try {
            this.config = this.parse(await (0, _promises.readFile)(this.filePath, 'utf-8'));
        } catch (error) {
            if (noThrow) {
                return undefined;
            }
            throw error;
        }
        logger?.log('info', `Configuration is loaded from "${_nodepath.default.relative(process.cwd(), this.filePath)}"`);
        return this.config;
    }
    /**
     * Start saving the config to files
     * @returns {Promise.<*>}
     */ async save_() {
        await (0, _promises.writeFile)(this.filePath, this.stringify(), 'utf-8');
    }
    /**
     * Update config item by dotted path.
     * @param {string} key - The path of config item, e.g. "item.subItem.key" refers to { item: { subItem: { key: "*" } } }
     * @param {*} value - New value of config item
     * @returns {JsonConfigProvider}
     */ setItem(key, value) {
        _utils._.set(this.config, key, value);
        return this;
    }
    /**
     * Get config item by dotted path.
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */ getItem(key, defaultValue) {
        return _utils._.get(this.config, key, defaultValue);
    }
    /**
     * JSON file config data source
     * @constructs JsonConfigProvider
     * @param {string} filePath - The path of config file
     */ constructor(filePath){
        this.filePath = filePath;
        /**
         * The loaded config
         * @type {object}
         * @public
         */ this.config = undefined;
    }
}
const _default = JsonConfigProvider;

//# sourceMappingURL=JsonConfigProvider.js.map