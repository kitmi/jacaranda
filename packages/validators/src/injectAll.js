import { createJSX } from '@kitmi/jsonx';
import en from '@kitmi/jsonv/locale/en';

import text from './validators/text';

import commonValidators from './validators/common';
import commonProcessors from './processors/common';
import commonActivators from './activators/common';

const JSX = createJSX();
const JSV = JSX.JSV;

JSV.config.loadMessages('en', en).setLocale('en');

const jsx = (value, options, meta, context) => JSX.evaluate(value, options, { path: context.path });
const jsv = (value, options, meta, context) => JSV.match(value, options, null, { path: context.path });

const injectAll = (typeSystem) => {
    typeSystem.addValidator('jsv', jsv);
    typeSystem.addModifiers('validator', text);
    typeSystem.addModifiers('validator', commonValidators);

    typeSystem.addProcessor('jsx', jsx);
    typeSystem.addModifiers('processor', commonProcessors);

    typeSystem.addModifiers('activator', commonActivators);

    typeSystem.jsvConfig = JSV.config;
};

export default injectAll;
