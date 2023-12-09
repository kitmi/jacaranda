import JSX from '@kitmi/jsonx';

const jsx = (value, options, meta, context) =>
    JSX.evaluate(value, options, { name: context.path, locale: context.i18n?.locale });

export default {
    jsx,
};
