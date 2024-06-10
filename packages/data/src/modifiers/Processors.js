import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import normalizePhone from '../utils/normalizePhone';

const Processors = _.mapValues(
    typeSystem.handlers.processor,
    (processor) => (entity, field, context, value, options) => processor(value, options, meta, context)
);
Processors.normalizePhone = (entity, field, context, value, options) => normalizePhone(value, options);

export default Processors;
