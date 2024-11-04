import Feature from '../Feature';
import { DateTime } from 'luxon';

export default {
    stage: Feature.INIT,

    load_: async function (app, options, name) {
        options = app.featureConfig(
            options,
            {
                schema: {
                    locale: { type: 'text', default: 'en' },
                    timezone: { type: 'text', optional: true },
                },
            },
            name
        );

        app.i18n = {
            ...options,
            datePlus: (date, duration) => {
                return DateTime.fromJSDate(date).plus(duration).toJSDate();
            },
            dateMinus: (date, duration) => {
                return DateTime.fromJSDate(date).minus(duration).toJSDate();
            },
        };
    },
};
