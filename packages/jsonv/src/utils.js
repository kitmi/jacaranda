export const namingFactory = (nameOfValue) => (name, left, context, custom) => {
    const fullName = name == null ? context.path : makePath(name, context?.path);

    return fullName == null ? nameOfValue(custom) : `"${context?.mapOfNames ? context.mapOfNames[fullName] : fullName}"`;
};

export const formatKey = (key, hasPrefix) => (Number.isInteger(key) ? `[${key}]` : hasPrefix ? '.' + key : key);
export const makePath = (key, prefix) => (prefix != null ? `${prefix}${formatKey(key, true)}` : formatKey(key, false));
export const formatPath = (prefix) => (prefix ? '[' + prefix + ']' : '<ROOT>');
