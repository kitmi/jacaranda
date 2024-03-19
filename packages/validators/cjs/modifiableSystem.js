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
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const createModifiableSystem = (postProcess)=>{
    const system = (0, _types.createTypeSystem)();
    const handlers = {
        validator: {},
        processor: {},
        activator: {}
    };
    system.handlers = handlers;
    system.addModifier = (type, name, modifier)=>{
        if (name in handlers[type]) {
            throw new _types.InvalidArgument(`The ${type} with name "${name}" already exists`);
        }
        handlers[type][name] = modifier;
    };
    system.addValidator = (name, validate)=>system.addModifier('validator', name, validate);
    system.addProcessor = (name, processor)=>system.addModifier('processor', name, processor);
    system.addActivator = (name, activator)=>system.addModifier('activator', name, activator);
    system.addModifiers = (type, modifiersSet)=>{
        _utils._.each(modifiersSet, (modifier, name)=>system.addModifier(type, name, modifier));
    };
    system.addPlugin('postProcess', postProcess);
    return system;
};
const _default = createModifiableSystem;

//# sourceMappingURL=modifiableSystem.js.map