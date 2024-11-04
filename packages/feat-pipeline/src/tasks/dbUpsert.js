import { _, isPlainObject } from '@kitmi/utils';
import { Types } from '@kitmi/validators/allSync';

function mergeWhereIntoData(where, data) {
    const flatten = (obj) =>
        _.reduce(
            obj,
            (acc, value, key) => {
                if (isPlainObject(value)) {
                    Object.assign(acc, flatten(value));
                    return acc;
                }

                acc[key] = value;
                return acc;
            },
            {}
        );

    return { ...flatten(where), ...data };
}

export default async function dbFindUnique(step, settings) {
    let { service, model, where, create, update } = Types.OBJECT.sanitize(settings, {
        schema: {
            service: { type: 'text' },
            model: { type: 'text' },
            where: { type: 'object' },
            create: { type: 'object', optional: true },
            update: { type: 'object', optional: true },
        },
    });

    service = step.getService(service);
    model = step.getValue(model);
    where = step.replaceValues(where);

    if (create) {
        create = step.replaceValues(create);
    }
    if (update) {
        update = step.replaceValues(update);
    }

    const Model = service[model];
    const upsertInfo = { where, create: mergeWhereIntoData(where, create), update: mergeWhereIntoData(where, update) };

    await Model.upsert(upsertInfo);

    return null;
}
