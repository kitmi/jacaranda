import createModifiableSystem from './modifiableSystem';
import { postProcess } from './modifier';

const typeSystem = createModifiableSystem(postProcess);

export const Types = typeSystem.types;
export default typeSystem;
