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
 * Convert the schedule pattern to cron format.
 * @param {object} nodeSchedule
 * @param {object} cronInfo
 * @returns {array} [rule, description]
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

    const scheduledJobs = {};

    return startWorker(async (app) => {
        const nodeSchedule = await app.tryRequire_('node-schedule', true);

        app.on('stopping', async () => {
            // eslint-disable-next-line no-undef
            nodeSchedule.gracefulShutdown().catch((error) => console.error(error.message || error));
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

            const reportInterval = schedule.reportInterval ?? 1;

            scheduledJobs[job] = nodeSchedule.scheduleJob(cron, function () {
                let asyncCall = job === '_report-schedules' ? fnJob(app, schedules, scheduledJobs) : fnJob(app);

                asyncCall
                    .then(() => {
                        const completed = ++counters[job];

                        if (completed % reportInterval === 0) {
                            app.log('info', `Job [${job}] has been executed for ${completed} time(s).`);
                        }
                    })
                    .catch((error) => {
                        app.logError(error);
                    });
            });
        });

        return app;
    }, workerOptions);
}

export default startScheduler;
