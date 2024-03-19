import { createTypeSystem, InvalidArgument } from '@kitmi/types';
import { _ } from '@kitmi/utils';

const createModifiableSystem = (postProcess) => {
    const system = createTypeSystem();
    const handlers = {
        validator: {},
        processor: {},
        activator: {},
    };

    system.handlers = handlers;

    system.addModifier = (type, name, modifier) => {
        if (name in handlers[type]) {
            throw new InvalidArgument(`The ${type} with name "${name}" already exists`);
        }

        handlers[type][name] = modifier;
    };

    system.addValidator = (name, validate) => system.addModifier('validator', name, validate);

    system.addProcessor = (name, processor) => system.addModifier('processor', name, processor);

    system.addActivator = (name, activator) => system.addModifier('activator', name, activator);

    system.addModifiers = (type, modifiersSet) => {
        _.each(modifiersSet, (modifier, name) => system.addModifier(type, name, modifier));
    };

    system.addPlugin('postProcess', postProcess);

    return system;
};

export default createModifiableSystem;
