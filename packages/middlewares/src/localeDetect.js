/**
 * Browser locale detection middleware
 * @module Middleware_LocaleDetect
 */

import locale from 'locale';

const localeDetect = async (options, app) => {
    let {
        queryKey,
        supported: supportedLocales,
        default: defaultLocale,
    } = app.middlewareConfig(
        options,
        {
            schema: {
                queryKey: { type: 'text', optional: true, default: 'lang' },
                supported: {
                    type: 'array',
                    element: {
                        type: 'text', // ISO-639 language abbreviation and optional two-letter ISO-3166 country code
                    },
                    post: [['~minLength', 1]],
                },
                default: { type: 'text', optional: true },
            },
        },
        'localeDetect'
    );

    defaultLocale || (defaultLocale = supportedLocales[0]);
    defaultLocale = defaultLocale.replace('-', '_');

    const supported = new locale.Locales(
        supportedLocales.map((l) => l.replace('-', '_')),
        defaultLocale
    );

    return (ctx, next) => {
        let reqLang = ctx.query[queryKey];
        if (reqLang) {
            reqLang = reqLang.replace('-', '_');
        }
        const locales = new locale.Locales(reqLang ?? ctx.headers['accept-language']);        
        ctx.state.locale = locales.best(supported).normalized.replace('_', '-');
        return next();
    };
};

export default localeDetect;
