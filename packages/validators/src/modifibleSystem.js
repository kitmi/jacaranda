import { createTypeSystem, InvalidArgument } from '@kitmi/types';
import { _ } from '@kitmi/utils';

const createModifiableSystem = () => {
    const validator = createTypeSystem();
    const handlers = {
        validator: {},
        processor: {},
        activator: {},
    };

    validator.handlers = handlers;

    validator.addModifier = (type, name, modifier) => {
        if (name in handlers[type]) {
            throw new InvalidArgument(`The ${type} with name "${name}" already exists`);
        }

        handlers[type][name] = modifier;
    };

    validator.addValidator = (name, validate) => validator.addModifier('validator', name, validate);

    validator.addProcessor = (name, processor) => validator.addModifier('processor', name, processor);

    validator.addActivator = (name, activator) => validator.addModifier('activator', name, activator);

    validator.addModifiers = (type, modifiersSet) => {
        _.each(modifiersSet, (modifier, name) => validator.addModifier(type, name, modifier));
    };

    return validator;
};

export default createModifiableSystem;
