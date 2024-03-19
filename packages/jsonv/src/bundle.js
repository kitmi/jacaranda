import defaultConfig from './config';
import loadLocales from './localesLoader';

loadLocales(defaultConfig);

export * from './index';
export { default } from './index';
