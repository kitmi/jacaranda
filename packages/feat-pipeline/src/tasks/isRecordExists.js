import { _ } from '@kitmi/utils';
import { Types } from '@kitmi/validators/allSync';

export default async function isRecordExists(step, settings) {
    let { service, model, where } = Types.OBJECT.sanitize(settings, {
        schema: {
            service: { type: 'text' },
            model: { type: 'text' },
            where: { type: 'object' }
        },
    });

    service = step.getService(service);
    model = step.getValue(model);
    where = _.mapValues(where, (value) => {
        if (typeof value !== 'string') {
            throw new Error('Value name must be a string, for literal values please use "define" task.');
        }

        return step.getValue(value);
    });

    const Model = service[model];
    const record = await Model.findUnique({ where });
    const recordExists = record != null;

    step.stepLog('info', recordExists ? 'Record exists.' : 'Record not found.', {        
        record
    });

    return recordExists;
}
