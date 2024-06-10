const defaultValueByType = (options, meta, context) => context.system.types[meta.type].defaultValue;

export default {
    default: defaultValueByType,
    defaultAs: (options) => options,
    random: (_0, meta, context) => {
        switch (meta.type) {
            case 'int':
                return Math.floor(Math.random() * 100);
            case 'float':
                return Math.random() * 100;
            case 'text': {
                const l = meta.fixedLength || meta.maxLength;

                let str = '';
                while (str.length < l) {
                    str += Math.random().toString(36).substring(2);
                }
                return str.substring(0, l);
            }
            case 'date':
                return new Date(Math.floor(Math.random() * 1000000000000) + 600000000000);
            case 'bool':
                return Math.random() > 0.5;
            default:
                return defaultValueByType({}, meta, context);
        }
    },
    now: () => new Date(),
};
