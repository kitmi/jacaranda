import validator from './async';
import injectAll from './injectAll';

injectAll(validator);

export * from './validator';
export default validator;
