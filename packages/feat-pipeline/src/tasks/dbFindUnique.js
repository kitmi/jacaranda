import { _ } from '@kitmi/utils';
import { Types } from '@kitmi/validators/allSync';

export async function findUnique_(step, settings) {
    let { service, model, where } = Types.OBJECT.sanitize(settings, {
        schema: {
            service: { type: 'text' },
            model: { type: 'text' },
            where: { type: 'object' },
        },
    });

    service = step.getService(service);
    model = step.getValue(model);
    where = step.replaceValues(where);

    const Model = service[model];
    const record = await Model.findUnique({ where });

    return record;
}

export default async function dbFindUnique(step, settings) {
    const record = await findUnique_(step, settings);

    if (record == null) {
        throw new Error('Record not found.');
    }

    step.syslog('info', 'Record found.', {
        result: record,
    });

    return record;
}
