import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import normalizePhone from '../utils/normalizePhone';

const processorTable = typeSystem.handlers.processor;
processorTable.normalizePhone = (value, options) => normalizePhone(value, options);

export const _Processors = _.mapValues(
    processorTable,
    (processor) => (entity, field, context, value, options) => processor(value, options, meta, context)
);

export default processorTable;
