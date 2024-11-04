import { processExprLikeValue } from '@kitmi/jsonv';
import { createJSX } from '@kitmi/jsonx';

import en from '@kitmi/jsonv/locale/en';

import { typesToJsv, jsvToTypes } from './adapters';
import text from './validators/text';

import commonValidators from './validators/common';
import commonProcessors from './processors/common';
import commonActivators from './activators/common';

const injectAll = (typeSystem) => {
    const JSX = createJSX();
    const JSV = JSX.JSV;
    const BINARY = false;

    JSV.config.loadMessages('en', en).setLocale('en');
    JSX.config.addTransformerToMap(
        ['sanitize', BINARY, '$sanitize'],
        (left, right, context) => {
            right = processExprLikeValue(right, context);
            return typeSystem.sanitize(left, right, jsvToTypes(context));
        },
        true /* override */
    );

    const jsx = (value, options, meta, context) => JSX.evaluate(value, options, typesToJsv(context, meta));
    const jsv = (value, options, meta, context) =>
        JSV.match(value, options, { plainError: false }, typesToJsv(context, meta));
    jsv.__metaCheckNull = true;

    typeSystem.addValidator('jsv', jsv);
    typeSystem.addModifiers('validator', text);
    typeSystem.addModifiers('validator', commonValidators);

    typeSystem.addProcessor('jsx', jsx);
    typeSystem.addModifiers('processor', commonProcessors);

    typeSystem.addModifiers('activator', commonActivators);

    typeSystem.jsvConfig = JSV.config;
};

export default injectAll;
