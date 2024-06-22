const path = require("node:path");
const { _, esmCheck, baseName } = require("@kitmi/utils");
const { fs, requireFrom } = require("@kitmi/sys");
const { globSync } = require("glob");
const Types = require("./Types");

const Xeml = require("./grammar/xeml");
const XemlParser = Xeml.parser;
const XemlTypes = require("./XemlTypes");
const Entity = require("./Entity");
const Schema = require("./Schema");
const View = require("./View");
const Dataset = require("./Dataset");

const {
    isIdWithNamespace,
    extractNamespace,
    isDotSeparateName,
    extractDotSeparateName,
} = require('./XemlUtils');

const ELEMENT_CLASS_MAP = {
    [XemlTypes.Element.ENTITY]: Entity,
    [XemlTypes.Element.VIEW]: View,
    [XemlTypes.Element.DATASET]: Dataset,
};

const ELEMENT_WITH_MODULE = new Set([ XemlTypes.Element.TYPE, XemlTypes.Element.ACTIVATOR, XemlTypes.Element.PROCESSOR, XemlTypes.Element.VALIDATOR ]);

const XEML_SOURCE_EXT = ".xeml";
const BUILTINS_PATH = path.resolve(__dirname, "builtins");

const CONTEXT_REFS = new Set([ 'latest', 'existing', 'raw' ]);

/**
 * Linker of xeml
 * @class XemlLinker
 */
class Linker {
    /**
     * Get xeml files
     * @param {string} sourceDir
     * @param {boolean} [useJsonSource]
     * @param {boolean} [recursive]
     * @returns {array} xeml files
     */
    static getXemlFiles(sourceDir, useJsonSource, recursive) {
        let pattern = "*" + XEML_SOURCE_EXT;

        if (useJsonSource) {
            pattern += ".json";
        }

        if (recursive) {
            pattern = "**/" + pattern;
        }

        return globSync(pattern, { nodir: true, cwd: path.resolve(sourceDir) });
    }

    /**
     * Compile and link xeml files into schema objects
     * @param {App} app
     * @param {object} options
     * @returns {object} map of schema name to object
     */
    static buildSchemaObjects(app, options) {
        const schemaObjects = {};
        const schemaFiles = Linker.getXemlFiles(options.schemaPath, options.useJsonSource);
        
        schemaFiles.forEach((schemaFile) => {
            const linker = new Linker(app, options);
            linker.link(schemaFile);

            _.forEach(linker.schemas, async (schemaObject, schemaName) => {
                if (schemaObjects[schemaName]) {
                    throw new Error(`Duplicate schema found: "${schemaName}".`);
                }

                schemaObjects[schemaName] = schemaObject;
            });
        });

        return schemaObjects;
    }

    /**
     * @param {ServiceContainer} app
     * @param {object} options
     * @property {string} options.schemaPath - Geml source files path
     * @property {bool} [options.useJsonSource=false] - Use .json intermediate source file instead of .ool
     * @property {bool} [options.saveIntermediate=false] - Save intermediate source file while linking
     */
    constructor(app, options) {
        /**
         * App
         * @member {ServiceContainer}
         */
        this.app = app;

        /**
         * Geml source files path
         * @member {string}
         */
        this.sourcePath = options.schemaPath;

        /**
         * Use json or ols
         * @member {bool}
         */
        this.useJsonSource = options.useJsonSource;

        /**
         * Save intermediate files
         * @member {bool}
         */
        this.saveIntermediate = options.saveIntermediate;

        /**
         * Linked schemas
         * @member {object.<string, Schema>}
         */
        this.schemas = {};

        /**
         * Dependent packages
         * @member {object.<string, string>}
         */
        this.dependencies = options.dependencies ?? {};

        /**
         * Parsed oolong files, path => module
         * @member {object}
         * @private
         */
        this._xemlModules = {};

        /**
         * Element cache, map of <referenceId, element> and <selfId, element>
         * @member {object}
         * @private
         */
        this._elementsCache = {};

        /**
         * Map of <referenceId, moduleId>
         * @member {object}
         * @private
         */
        this._mapOfReferenceToModuleId = {};

        //this.entryModule
        //this.customizeEntities
    }

    /**
     * Write log
     * @param {string} level
     * @param {string} message
     * @param {object} [data]
     */
    log(...args) {
        this.app.log(...args);
    }

    /**
     * Check whether a module is loaded
     * @param {string} moduleId
     * @returns {boolean}
     */
    isModuleLoaded(moduleId) {
        return moduleId in this._xemlModules;
    }

    /**
     * Get a loaded oolone module
     * @param {string} moduleId
     * @returns {object}
     */
    getModuleById(moduleId) {
        return this._xemlModules[moduleId];
    }

    /**
     * Start linking oolong files
     * @param {string} entryFileName
     */
    link(entryFileName) {
        // compile entry file
        this.entryModule = this.loadModule(entryFileName);

        if (!this.entryModule) {
            throw new Error(`Cannot resolve file "${entryFileName}".`);
        }

        if (_.isEmpty(this.entryModule.schema)) {
            throw new Error("No schema defined in entry file.");
        }

        if (this.entryModule.overrides) {
            if (this.entryModule.overrides.entities) {
                this.customizeEntities = new Set(
                    this.entryModule.overrides.entities.map((entityItem) => entityItem.entity)
                );
            }
        }

        // compile schemas
        _.forOwn(this.entryModule.schema, (schemaInfo, schemaName) => {
            let schema = new Schema(this, schemaName, schemaInfo);
            schema.link();

            this.schemas[schemaName] = schema;

            if (this.saveIntermediate) {
                let jsFile = path.resolve(this.sourcePath, entryFileName + "-linked.json");
                fs.writeFileSync(jsFile, JSON.stringify(schema.toJSON(), null, 4));
            }
        });
    }

    /**
     * Load a xeml module, return undefined if not exist
     * @param {string} modulePath
     * @param {string} [packageName]
     * @returns {*}
     */
    loadModule(modulePath, packageName) {
        modulePath = path.resolve(this.sourcePath, modulePath);

        let id = this.getModuleIdByPath(modulePath);

        if (this.isModuleLoaded(id)) {
            return this.getModuleById(id);
        }

        if (!fs.existsSync(modulePath)) {
            return undefined;
        }

        let xemlModule = this._compile(modulePath, packageName);

        return (this._xemlModules[id] = xemlModule);
    }

    getTypeInfo(name, location) {
        const xemlModule = this.getModuleById(location);
        return xemlModule.type[name];
    }

    /**
     * Track back the type derived chain.
     * @param {object} xemlModule
     * @param {object} info
     * @returns {Array} [ derivedInfo, baseInfo ]
     */
    trackBackType(xemlModule, info) {
        if (info.type in Types) {
            return [info];
        }

        let baseInfo = this.loadElement(xemlModule, XemlTypes.Element.TYPE, info.type, true);
        let backupBaseInfo = baseInfo.type !== info.type ? baseInfo : null;

        if (!(baseInfo.type in Types)) {
            //the base type is not a builtin type
            let ownerModule = baseInfo.xemlModule;

            let [rootTypeInfo] = this.trackBackType(ownerModule, baseInfo);

            ownerModule.type[baseInfo.type] = rootTypeInfo;
            baseInfo = rootTypeInfo;
        } else {
            backupBaseInfo = null;
        }

        let derivedInfo = {
            ..._.cloneDeep(_.omit(baseInfo, ["xemlModule", "modifiers"])),
            ..._.omit(info, ["xemlModule", "type", "modifiers"]),
        };
        if (baseInfo.modifiers || info.modifiers) {
            derivedInfo.modifiers = [...(baseInfo.modifiers || []), ...(info.modifiers || [])];
        }

        if (!derivedInfo.subClass) {
            derivedInfo.subClass = [];
        }
        derivedInfo.subClass.push(info.type);
        return [derivedInfo, backupBaseInfo];
    }

    /**
     * Translate an value by inferring all the references.
     * @param {object} xemlModule
     * @param {*} value
     * @returns {*} - Translated value.
     */
    translateXemlValue(xemlModule, value) {
        if (_.isPlainObject(value)) {
            if (value.$xt === XemlTypes.Lang.CONST_REF) {
                let refedValue = this.loadElement(xemlModule, XemlTypes.Element.CONST, value.name, true);
                let uniqueId = this.getElementUniqueId(xemlModule, XemlTypes.Element.CONST, value.name);
                let ownerModule = this.getModuleById(this._mapOfReferenceToModuleId[uniqueId]);
                return this.translateXemlValue(ownerModule, refedValue);
            } else if (value.$xt) {                
                switch (value.$xt) {
                    case XemlTypes.Lang.OBJECT_REF:
                        let refName = value.name;

                        if (isDotSeparateName(value.name)) {
                            refName = extractDotSeparateName(value.name)[0];
                        }

                        if (!CONTEXT_REFS.has(refName)) {
                            throw new Error(`Invalid object reference "${value.name}"`);
                        }
                        
                        return { $xr: 'Data', name: value.name };
                }

                throw new Error(`todo: translateXemlValue with type: ${value.$xt}`);
            }

            return _.mapValues(value, (v) => this.translateXemlValue(xemlModule, v));
        }

        if (Array.isArray(value)) {
            return value.map((v) => this.translateXemlValue(xemlModule, v));
        }

        return value;
    }

    /**
     * Get the unique module id by source file path.
     * @param {string} modulePath - The path of an oolong source file.
     * @returns {string} - The module id.
     */
    getModuleIdByPath(modulePath) {
        let isBuiltinEntity = _.startsWith(modulePath, BUILTINS_PATH);
        return isBuiltinEntity
            ? path.relative(BUILTINS_PATH, modulePath)
            : "./" + path.relative(this.sourcePath, modulePath);
    }

    /**
     * Get the unique name of an element.
     * @param {object} refererModule
     * @param {string} elementType
     * @param {string} elementName
     * @returns {string} - The unique name of an element.
     */
    getElementUniqueId(refererModule, elementType, elementName) {
        return elementType + ":" + elementName + "<-" + refererModule.id;
    }

    loadEntity(refererModule, elementName, throwOnMissing = true) {
        return this.loadElement(refererModule, XemlTypes.Element.ENTITY, elementName, throwOnMissing);
    }

    loadEntityTemplate(refererModule, elementName, args) {
        const templateInfo = this.loadElement(refererModule, XemlTypes.Element.ENTITY_TEMPLATE, elementName, true);
        
        const templateArgs = templateInfo.templateArgs;
        if (templateArgs.length !== args.length) {
            throw new Error(`Arguments mismatch for entity template "${elementName}"`);
        }

        const variables = {};

        templateInfo.templateArgs.forEach((arg, index) => {
            if (arg.name[0] !== arg.name[0].toUpperCase()) {
                throw new Error(`Entity template argument name "${arg.name}" should be in PascalCase.`);
            }
            variables[arg.name] = args[index];
        });

        const instanceInfo = _.mapValues(templateInfo, (value, key) => {
            if (key === "fields") {
                return _.mapValues(value, (fieldInfo) => {
                    if (fieldInfo.type in variables) {
                        return { ...fieldInfo, type: variables[fieldInfo.type] };
                    }
                    return fieldInfo;
                });
            }

            // todo: other blocks

            return value;
        });

        delete instanceInfo.templateArgs;

        const element = new Entity(this, elementName, refererModule, instanceInfo);
        element.link();

        return element;
    }

    loadType(refererModule, elementName, throwOnMissing = true) {
        return this.loadElement(refererModule, XemlTypes.Element.TYPE, elementName, throwOnMissing);
    }

    loadDataset(refererModule, elementName, throwOnMissing = true) {
        return this.loadElement(refererModule, XemlTypes.Element.DATASET, elementName, throwOnMissing);
    }

    loadView(refererModule, elementName, throwOnMissing = true) {
        return this.loadElement(refererModule, XemlTypes.Element.VIEW, elementName, throwOnMissing);
    }

    /**
     * Load an element based on the namespace chain.
     * @param {object} refererModule - The module that refers to the element.
     * @param {string} elementType - The type of the element: entity, type, modifier, etc.
     * @param {string} elementName - The name of the element.
     * @param {boolean} throwOnMissing - Throw an error if the element is not found.
     * @returns {*}
     */
    loadElement(refererModule, elementType, elementName, throwOnMissing) {
        // the element id with type, should be unique among the whole schema
        let uniqueId = this.getElementUniqueId(refererModule, elementType, elementName);

        // the element id + referer
        if (uniqueId in this._elementsCache) {
            return this._elementsCache[uniqueId];
        }

        let packageNamespace, moduleNamespace;
        let withNamespace = false;

        if (isIdWithNamespace(elementName)) {
            withNamespace = true;

            // the element name is a namespace
            let [namespace, name] = extractNamespace(elementName);
            elementName = name;

            const namespaceParts = namespace.split(":");
            if (namespaceParts.length > 2) {
                // todo: support moduleNamespace with path
                throw new Error(`Invalid namespace syntax "${namespace}"`);
            } else if (namespaceParts.length === 2) {
                packageNamespace = namespaceParts[0];
                moduleNamespace = namespaceParts[1];
            } else {
                moduleNamespace = namespaceParts[0];
            }
        }

        let targetModule;

        if (!withNamespace && elementType in refererModule && elementName in refererModule[elementType]) {
            // see if it exists in the same module
            targetModule = refererModule;
        } else {
            // search reversely by the namespaces
            //this.log('verbose', `Searching ${elementType} "${elementName}" from "${refererModule.id}" ...`);

            let index = _.findLastIndex(refererModule.namespace, (modulePath) => {
                //this.log('debug', `Looking for ${elementType} "${elementName}" in "${modulePath}" ...`);
                let packageName;

                // from other package
                if (Array.isArray(modulePath)) {
                    packageName = modulePath[1]; // key in dependencies
                    modulePath = modulePath[0];
                }

                if (packageNamespace && packageName !== packageNamespace) {
                    return false;
                }

                if (moduleNamespace && baseName(modulePath, false) !== moduleNamespace) {
                    return false;
                }

                targetModule = this.loadModule(modulePath, packageName);
                if (!targetModule) {
                    return false;
                }

                return targetModule[elementType] && elementName in targetModule[elementType];
            });

            if (index === -1) {
                if (throwOnMissing) {
                    throw new Error(
                        `${elementType} "${elementName}" not found in imported namespaces. Referer: ${refererModule.id}`
                    );
                }

                return undefined;
            }
        }

        let elementSelfId = elementType + ":" + elementName + "@" + targetModule.id;
        if (elementSelfId in this._elementsCache) {
            // already initialized
            return (this._elementsCache[uniqueId] = this._elementsCache[elementSelfId]);
        }

        this._mapOfReferenceToModuleId[uniqueId] = targetModule.id;

        // retrieve the compiled info
        let elementInfo = targetModule[elementType][elementName];
        let element;

        if (elementType === XemlTypes.Element.ENTITY && this.customizeEntities?.has(elementName)) {            
            const overrideElement = this.loadElement(this.entryModule, XemlTypes.Element.ENTITY_OVERRIDE, elementName, true);

            Entity.overrideEntityMeta(elementInfo, overrideElement);
        }

        if (elementType in ELEMENT_CLASS_MAP) {
            // element need linking
            let ElementClass = ELEMENT_CLASS_MAP[elementType];

            element = new ElementClass(this, elementName, targetModule, elementInfo);
            element.link();
        } else {
            if (ELEMENT_WITH_MODULE.has(elementType)) {
                element = {
                    ...elementInfo,
                    xemlModule: targetModule,
                };
            } else {
                element = elementInfo;
            }
        }

        this._elementsCache[elementSelfId] = element;
        this._elementsCache[uniqueId] = element;

        return element;
    }

    _compile(xemlFile, packageName) {
        let jsFile;

        if (xemlFile.endsWith(".json")) {
            jsFile = xemlFile;
            xemlFile = xemlFile.substring(0, xemlFile.length - 5);
        } else {
            jsFile = xemlFile + ".json";
        }

        let xeml, searchExt;

        if (this.useJsonSource) {
            if (!fs.existsSync(jsFile)) {
                throw new Error(`"useJsonSource" enabeld but json file "${jsFile}" not found.`);
            }

            xeml = fs.readJsonSync(jsFile);
            searchExt = XEML_SOURCE_EXT + ".json";
        } else {
            try {
                xeml = XemlParser.parse(fs.readFileSync(xemlFile, "utf8"));
            } catch (error) {
                throw new Error(`Failed to compile "${xemlFile}".\n${error.message || error}`);
            }

            if (!xeml) {
                throw new Error("Unknown error occurred while compiling: " + xemlFile);
            }

            searchExt = XEML_SOURCE_EXT;
        }

        let baseName = path.basename(xemlFile, XEML_SOURCE_EXT);

        let namespace = [];

        let currentPath = path.dirname(xemlFile);

        /**
         *
         * @param {*} namespaces - Searching path
         * @param {string} ns - Import line
         * @param {*} recursive
         */
        function expandNs(namespaces, ns, recursive, packageName) {
            let stats = fs.statSync(ns);

            //import '/path/user.xeml'
            if (stats.isFile() && ns.endsWith(searchExt)) {
                if (packageName) {
                    namespaces.push([ns, packageName]);
                } else {
                    namespaces.push(ns);
                }

                return;
            }

            if (stats.isDirectory() && recursive) {
                //resursive expand sub-directory
                let files = fs.readdirSync(ns);
                files.forEach((f) => expandNs(namespaces, path.join(ns, f), true, packageName));
            }
        }

        if (xeml.namespace) {            
            xeml.namespace.forEach((ns) => {
                let p;
                let packageName;

                const packageSep = ns.indexOf(":");
                if (packageSep > 0) {
                    //reference to a package
                    packageName = ns.substring(0, packageSep);
                    const pkgPath = this.dependencies[packageName];

                    if (pkgPath == null) {
                        throw new Error(
                            `Package "${packageName}" not found in xeml dependencies settings. Failed to compile ${xemlFile}`
                        );
                    }

                    const files = ns.substring(packageSep + 1);

                    if (pkgPath.startsWith(".") || pkgPath.startsWith("..")) {
                        ns = path.join(pkgPath, files);    
                    } else {
                        const schemaPath = esmCheck(requireFrom(pkgPath, process.cwd())).schemaPath;                        
                        ns = path.join(schemaPath, files);
                    }                    
                }

                if (ns.endsWith("/*")) {
                    p = path.resolve(currentPath, ns.substr(0, ns.length - 2));
                    let files = fs.readdirSync(p);
                    files.forEach((f) => expandNs(namespace, path.join(p, f), false, packageName));
                } else if (ns.endsWith("/**")) {
                    p = path.resolve(currentPath, ns.substr(0, ns.length - 3));
                    let files = fs.readdirSync(p);
                    files.forEach((f) => expandNs(namespace, path.join(p, f), true, packageName));
                } else {
                    ns = path.resolve(currentPath, _.endsWith(ns, XEML_SOURCE_EXT) ? ns : ns + XEML_SOURCE_EXT);
                    if (packageName) {
                        namespace.push([ns, packageName]);
                    } else {
                        namespace.push(ns);
                    }
                }
            });
        }

        xeml.namespace = namespace;

        xeml.id = this.getModuleIdByPath(xemlFile);
        if (packageName) {
            xeml.packageName = packageName;
        }
        xeml.name = baseName;

        if (!this.useJsonSource && this.saveIntermediate) {
            fs.writeFileSync(jsFile, JSON.stringify(xeml, null, 4));
        }

        return xeml;
    }
}

module.exports = Linker;
