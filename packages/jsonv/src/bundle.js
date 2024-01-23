import config from './config';
import loadLocales from './localesLoader';

loadLocales(config);

export * from './index';
export { default } from './index';
