import config from './config';
import en from './locale/en';
import zh from './locale/zh';
import zhHant from './locale/zh-Hant';

config
    .loadMessages('en', en)
    .loadMessages('en-AU', en)
    .loadMessages('en-GB', en)
    .loadMessages('en-US', en)
    .loadMessages('zh', zh)
    .loadMessages('zh-CN', zh)
    .loadMessages('zh-TW', zhHant)
    .loadMessages('zh-HK', zhHant)
    .setLocale('en');

export * from './index';
export { default } from './index';
