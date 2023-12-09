import createModifiableSystem from './modifibleSystem';
import { postProcess } from './modifier';

const validator = createModifiableSystem();
validator.addPlugin('postProcess', postProcess);

export const Types = validator.types;

export default validator;
