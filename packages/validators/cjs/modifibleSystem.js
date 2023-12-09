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
const createModifiableSystem = ()=>{
    const validator = (0, _types.createTypeSystem)();
    const handlers = {
        validator: {},
        processor: {},
        activator: {}
    };
    validator.handlers = handlers;
    validator.addModifier = (type, name, modifier)=>{
        if (name in handlers[type]) {
            throw new _types.InvalidArgument(`The ${type} with name "${name}" already exists`);
        }
        handlers[type][name] = modifier;
    };
    validator.addValidator = (name, validate)=>validator.addModifier('validator', name, validate);
    validator.addProcessor = (name, processor)=>validator.addModifier('processor', name, processor);
    validator.addActivator = (name, activator)=>validator.addModifier('activator', name, activator);
    validator.addModifiers = (type, modifiersSet)=>{
        _utils._.each(modifiersSet, (modifier, name)=>validator.addModifier(type, name, modifier));
    };
    return validator;
};
const _default = createModifiableSystem;

//# sourceMappingURL=modifibleSystem.js.map