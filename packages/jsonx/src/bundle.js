import config from './config';
import loadLocales from '@kitmi/jsonv/localesLoader';

loadLocales(config);

export * from './index';
export { default } from './index';
