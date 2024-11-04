import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import normalizePhone from '../utils/normalizePhone';

const processorTable = typeSystem.handlers.processor;
processorTable.normalizePhone = normalizePhone;

export const _Processors = _.mapValues(
    processorTable,
    (processor, name) => (entity, field, context, value, options) => {
        if (skipProcessor(field, context, name)) return value;

        if (context.options.$dryRun) {
            try {
                return processor(value, options, field, context);
            } catch (error) {
                return value;
            }
        }

        return processor(value, options, field, context);
    }
);

export const skipProcessor = (field, context, processorName) => {
    const processors = context?.options.$skipProcessors;

    if (processors && (processors.has(processorName) || processors.has(field.name + '.' + processorName))) return true;
    return false;
};

export default processorTable;
