import { Types } from '@kitmi/validators/allSync';

const defaultGenerator = (info, i18n) => {
    const typeObject = Types[info.type];
    const originType = typeObject.name;

    switch (originType) {
        case 'datetime':
            if (info.auto === 'now') {
                return i18n ? i18n.now() : new Date();
            }
            break;
    }

    return typeObject.defaultValue;
}

export default defaultGenerator;