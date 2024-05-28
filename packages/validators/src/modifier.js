import { InvalidArgument, ValidationError } from '@kitmi/types';
import { eachAsync_ } from '@kitmi/utils';

function getHandler(modifier, handlers) {
    let handlerType = null;
    let handlerKey = modifier.substring(1);
    let isValidator = false;
    let isActivator = false;

    if (modifier.startsWith('~')) {
        handlerType = handlers.validator;
        isValidator = true;
    } else if (modifier.startsWith('|')) {
        handlerType = handlers.processor;
    } else if (modifier.startsWith('=')) {
        handlerType = handlers.activator;
        isActivator = true;
    } else {
        throw new InvalidArgument(`Unknown modifier: ${modifier}`);
    }

    const hanlder = handlerType[handlerKey];

    if (!hanlder) {
        throw new InvalidArgument(`Handler not found for modifier: ${modifier}`);
    }

    if (isValidator) {
        return validatorWrapper(hanlder);
    }

    if (isActivator) {
        return activatorWrapper(hanlder);
    }

    return processorWrapper(hanlder);
}

function validatorWrapper(validator) {
    return (value, options, meta, context) => {
        if (!validator.__metaCheckNull && value == null) return value;

        const [validated, reason] = validator(value, options, meta, context);

        if (!validated) {
            throw new ValidationError(reason, { value, options });
        }

        return value;
    };
}

function processorWrapper(processor) {
    return (value, options, meta, context) => {
        if (value == null) return value;

        return processor(value, options, meta, context);
    };
}

function activatorWrapper(activator) {
    return (value, options, meta, context) => {
        if (value == null) {
            return activator(options, meta, context);
        }

        return value;
    };
}

function createModifier(modifierItem, handlers) {
    let modifier;
    let options;
    const type = typeof modifierItem;

    if (type === 'string') {
        modifier = modifierItem;
    } else if (Array.isArray(modifierItem)) {
        [modifier, options] = modifierItem;
    } else if (type === 'object') {
        modifier = modifierItem.name;
        options = modifierItem.options;
    } else if (type === 'function') {
        
    }

    if (!modifier) {
        throw new InvalidArgument(`Invalid modifier syntax: ${JSON.stringify(modifierItem)}`);
    }

    return [getHandler(modifier, handlers), options];
}

/**
 * Apply post modifiers one-by-one
 * @param {*} value
 * @param {Object} meta - The current type meta
 * @property {Array} meta.post - The list of post modifiers
 * @property {string} meta.type - The type name
 * @param {Object} context
 * @property {Object} context.system - The type system
 * @property {Object} context.system.types - All types meta in the type system
 * @property {Object} context.system.handlers - The modifier handlers for the type system
 * @property {Object} context.i18n - The i18n object
 * @property {Function} context.i18n.t - The i18n translate function
 * @property {string} context.path - The current field path
 * @property {*} context.rawValue - The raw value
 * @returns {*}
 */
const applyModifiers = (value, meta, context) =>
    meta.post.reduce((_value, modifier) => {
        const [handler, options] = createModifier(modifier, context.system.handlers);
        return handler(_value, options, meta, context);
    }, value);

const applyModifiers_ = async (value, meta, context) => {
    await eachAsync_(meta.post, async (modifier) => {
        const [handler, options] = createModifier(modifier, context.system.handlers);
        value = await handler(value, options, meta, context);
    });

    return value;
};

export const postProcess_ = async (value, meta, opts) => {
    if (meta.post) {
        value = await applyModifiers_(value, meta, opts);
    }

    return value;
};

export const postProcess = (value, meta, opts) => {
    if (meta.post) {
        value = applyModifiers(value, meta, opts);
    }

    return value;
};
