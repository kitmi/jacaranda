const makeValidator = (validateFunc, message, checkNull) => {
    const functor = (value, options, meta, context) => {      
        const validated = validateFunc(value, options, context);
        if (!validated) {
            return [false, context.i18n?.t ? context.i18n.t(message, { value, options }) : message];
        }

        return [true];
    };

    if (checkNull) {
        functor.__metaCheckNull = true;
    }

    return functor;
};

export default makeValidator;
