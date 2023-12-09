import { _ } from '@kitmi/utils';
import path from 'node:path';
import { access, readFile, writeFile, constants } from 'node:fs/promises';

class JsonConfigProvider {
    /**
     * JSON file config data source
     * @constructs JsonConfigProvider
     * @param {string} filePath - The path of config file
     */
    constructor(filePath) {
        this.filePath = filePath;

        /**
         * The loaded config
         * @type {object}
         * @public
         */
        this.config = undefined;
    }

    parse(fileContent) {
        return JSON.parse(fileContent);
    }

    stringify() {
        return JSON.stringify(this.config ?? {}, null, 4);
    }

    /**
     * Start loading the config files
     * @returns {Promise.<object>}
     */
    async load_(logger, noThrow) {
        try {
            await access(this.filePath, constants.R_OK);
        } catch {
            return (this.config = null);
        }

        try {
            this.config = this.parse(await readFile(this.filePath, 'utf-8'));
        } catch (error) {
            if (noThrow) {
                logger?.log('warn', error.message || error);
                return undefined;
            }

            throw error;
        }

        logger?.log('info', `Configuration is loaded from "${path.relative(process.cwd(), this.filePath)}"`);

        return this.config;
    }

    /**
     * Start saving the config to files
     * @returns {Promise.<*>}
     */
    async save_() {
        await writeFile(this.filePath, this.stringify(), 'utf-8');
    }

    /**
     * Update config item by dotted path.
     * @param {string} key - The path of config item, e.g. "item.subItem.key" refers to { item: { subItem: { key: "*" } } }
     * @param {*} value - New value of config item
     * @returns {JsonConfigProvider}
     */
    setItem(key, value) {
        _.set(this.config, key, value);
        return this;
    }

    /**
     * Get config item by dotted path.
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    getItem(key, defaultValue) {
        return _.get(this.config, key, defaultValue);
    }
}

export default JsonConfigProvider;
