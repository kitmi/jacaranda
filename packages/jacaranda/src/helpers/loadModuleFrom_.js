import { get as _get, _, findKeyAsync_, esmCheck } from '@kitmi/utils';
import { InvalidArgument } from '@kitmi/types';

/**
 * 
 * @param {*} app 
 * @param {*} source 
 * @param {*} name 
 * @param {*} payloadPath 
 * @param {*} noThrow 
 * @param {*} namedExport 
 * @returns 
 */
const loadModuleFrom_ = async (app, source, name, payloadPath, namedExport, noThrow) => {
    if (!name) {
        throw new InvalidArgument('The module name is required.');
    }

    let _module;
    let fullPath = payloadPath ? [ ..._.castArray(payloadPath), name ] : [name];

    if (source === 'runtime') {
        let p = fullPath.join('/');
        if (namedExport) {
            p += "::" + namedExport;
        }
        _module = app.requireModule(p, noThrow);        
    } else if (source === 'direct') {
        if (payloadPath) {
            app.log('warn', "The 'payloadPath' is not supported and is ignored for 'direct' source.", {
                payloadPath
            });
        }
        _module = require(name);
        if (_module) {
            if (namedExport) {
                _module = _module[namedExport];
            } else {
                _module = esmCheck(_module);
            }
        } 
    } else if (source === 'registry') {
        _module = _get(app.registry, fullPath.join('.'));
    } else if (source === 'project') {  
        _module = await app.tryRequire_(fullPath.join('/'), namedExport == null /* useDefault */, noThrow);
    } else {
        throw new InvalidArgument(`Invalid module source "${source}".`);
    }

    if (_module == null && !noThrow) {
        throw new InvalidArgument(`Module "${name}" not found in "${source}".`);
    }

    return _module;
};

export const loadControllers_ = async (app, source, controllerPath, packageName) => {
    source = source ?? 'registry'; // backward compatibility
    let payloadPath;
    let moduleName = controllerPath;

    if (source === 'registry' || source === 'runtime') {
        payloadPath = 'controllers';
    } else if (source === 'project') {
        payloadPath = app.sourcePath;
    } else if (source === 'direct') {
        moduleName = packageName;
    }
 
    return loadModuleFrom_(app, source, moduleName, payloadPath);
};

export const loadController_ = async (app, source, controllerPath, controllerName, packageName) => {
    source = source ?? 'registry'; // backward compatibility
    let payloadPath;
    let moduleName = controllerName;

    if (source === 'registry' || source === 'runtime') {
        payloadPath = [ 'controllers', controllerPath ];
    } else if (source === 'project') {
        payloadPath = [ app.sourcePath, controllerPath ];
    } else if (source === 'direct') {
        moduleName = packageName;
    }
 
    return loadModuleFrom_(app, source, moduleName, payloadPath);
};

export const tryLoadFrom_ = async (app, type, sources, noThrow) => {
    let _module;
    await findKeyAsync_(sources, async (config, source) => {
        _module = await loadModuleFrom_(app, source, config.name, config.path, config.namedExport, true);
        return _module != null;
    });

    if (_module == null && !noThrow) {
        throw new InvalidArgument(`"${type}" not found in any of the sources: ${Object.keys(sources).join(', ')}`, sources);
    }

    return _module;
};

export default loadModuleFrom_;
