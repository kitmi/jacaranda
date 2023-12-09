const defaultValueByType = (options, meta, context) => context.system.types[meta.type].defaultValue;

export default {
    default: defaultValueByType,
};
