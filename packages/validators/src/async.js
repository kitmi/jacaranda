import createModifiableSystem from './modifibleSystem';
import { postProcess_ } from './modifier';

const validator = createModifiableSystem();
validator.addPlugin('postProcess', postProcess_);

export const Types = validator.types;

export default validator;
