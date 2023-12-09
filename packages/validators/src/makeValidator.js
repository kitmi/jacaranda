const makeValidator = (validateFunc, message) => (value, options, meta, context) => {
    const validated = validateFunc(value, options);
    if (!validated) {
        return [false, context.i18n?.t ? context.i18n.t(message, { value, options }) : message];
    }

    return [true];
};

export default makeValidator;
