import { Config } from '@kitmi/jsonv';
import loadValidators from '@kitmi/jsonv/validatorsLoader';
import loadTransformers from '@kitmi/jsonv/transformersLoader';

const config = new Config();
loadValidators(config);
loadTransformers(config);

export default config;