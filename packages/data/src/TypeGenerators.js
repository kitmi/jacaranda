import { Types } from '@kitmi/validators/allSync';

const defaultGenerator = (info, i18n) => {
    const typeObject = Types[info.type];
    const originType = typeObject.name;

    switch (originType) {
        case 'datetime':
            if (info.auto) {
                return new Date();
            }
            break;
    }

    return typeObject.defaultValue;
};

export default defaultGenerator;
