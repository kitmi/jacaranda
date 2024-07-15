import { _, toInteger, isPlainObject } from '@kitmi/utils';
import { InvalidArgument } from '@kitmi/types';
import startWorker from './worker';

export const cronPatterns = {
    EVERY_SECOND: 'every-second',
    EVERY_MINUTE: 'every-minute',
    EVERY_HOUR: 'every-hour',
    EVERY_DAY: 'every-day',
    EVERY_WEEK: 'every-week',
    EVERY_MONTH: 'every-month',
    BY_DATE: 'by-day',
};

/**
 *
 * @param {object} nodeSchedule
 * @param {object} cronInfo 
 * @returns 
 */
const toCronFormat = (nodeSchedule, { pattern, perUnit, day, hour, minute, second, tz, date }) => {
    perUnit = perUnit != null ? toInteger(perUnit) : 0;

    switch (pattern) {
        case cronPatterns.EVERY_SECOND:
            if (perUnit > 0) {
                return [`*/${perUnit} * * * * *`, `every ${perUnit} seconds`];
            } else {
                return ['* * * * * *', 'every second'];
            }

        case cronPatterns.EVERY_MINUTE:
            if (perUnit > 0) {
                return [`${second ?? 0} */${perUnit} * * * *`, `every ${perUnit} minutes`];
            } else {
                const rule = new nodeSchedule.RecurrenceRule();
                rule.second = second ?? 0;
                if (tz) rule.tz = tz;

                return [rule, 'every minute'];
            }

        case cronPatterns.EVERY_HOUR:
            if (perUnit > 0) {
                return [`${second ?? 0} ${minute ?? 0} */${perUnit} * * *`, 'every ${perUnit} hours'];
            } else {
                const rule = new nodeSchedule.RecurrenceRule();
                rule.second = second ?? 0;
                rule.minute = minute ?? 0;
                if (tz) rule.tz = tz;

                return [rule, 'every hour'];
            }

        case cronPatterns.EVERY_DAY:
            if (perUnit > 0) {
                return [`${second ?? 0} ${minute ?? 0} ${hour ?? 0} */${perUnit} * *`, `every ${perUnit} days`];
            } else {
                const rule = new nodeSchedule.RecurrenceRule();
                rule.second = second ?? 0;
                rule.minute = minute ?? 0;
                rule.hour = hour ?? 0;
                if (tz) rule.tz = tz;

                return [rule, 'every day'];
            }
        case cronPatterns.EVERY_MONTH:
            if (perUnit > 0) {
                return [
                    `${second ?? 0} ${minute ?? 0} ${hour ?? 0} ${day ?? 0} */${perUnit} *`,
                    `every ${perUnit} month`,
                ];
            } else {
                const rule = new nodeSchedule.RecurrenceRule();
                rule.second = second ?? 0;
                rule.minute = minute ?? 0;
                rule.hour = hour ?? 0;
                // rule.day = day ?? 1;
                rule.date = day ?? 1;

                if (tz) rule.tz = tz;

                return [rule, 'every month'];
            }

        case cronPatterns.BY_DATE:
            if (!date || !(date instanceof Date)) {
                throw new Error('Invalid date.');
            }
            return [date, 'on specified date: ' + date.toISOString()];

        default:
            throw new Error('To be implemented.');
    }
};

/**
 *
 * @param {Function} worker
 * @param {object} options
 */
async function startScheduler(schedules, jobs, options) {
    const workerOptions = { throwOnError: true, dontStop: true, ...options };
    if (!Array.isArray(schedules)) {
        throw new InvalidArgument('Invalid schedules.');
    }

    if (!isPlainObject(jobs)) {
        throw new InvalidArgument('Invalid jobs.');
    }

    return startWorker(async (app) => {
        const nodeSchedule = await app.tryRequire_('node-schedule', true);

        process.once('SIGINT', () => {
            nodeSchedule
                .gracefulShutdown()
                .then(() => {
                    return app.stop_();
                })
                .catch((error) => console.error(error.message || error));
        });

        const counters = _.mapValues(jobs, () => 0);

        schedules.forEach((schedule) => {
            const [cron, desc] = toCronFormat(nodeSchedule, schedule);
            const job = schedule.job;

            app.log('info', `Scheduled to execute job [${job}] ${desc}`);

            const fnJob = jobs[job];
            if (fnJob == null) {
                throw new InvalidArgument(`Job [${job}] not found.`, {
                    schedule,
                });
            }

            nodeSchedule.scheduleJob(cron, function () {
                fnJob(app)
                    .then(() => {
                        const completed = ++counters[job];
                        app.log('info', `Job [${job}] has been executed for ${completed} time(s).`);
                    })
                    .catch((error) => {
                        app.logError(error);
                    });
            });
        });
    }, workerOptions);
}

export default startScheduler;
