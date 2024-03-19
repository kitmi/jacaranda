import createModifiableSystem from './modifiableSystem';
import { postProcess_ } from './modifier';

const typeSystem = createModifiableSystem(postProcess_);

export const Types = typeSystem.types;
export default typeSystem;
