const LOG_UNKNOWN = 'unknown';
const LOG_DEBUG = 'debug';
const LOG_VERBOSE = 'verbose';
const LOG_INFO = 'info';
const LOG_WARNING = 'warning';
const LOG_ERROR = 'error';
const LOG_DISABLE = 'disable';
const TRACE = -1;
const DEBUG = 1;
const VERBOSE = 2;
const INFO = 3;
const WARNING = 4;
const ERROR = 5;

const mapLogLevels = {
    trace: TRACE,
    debug: DEBUG,
    verbose: VERBOSE,
    info: INFO,
    warning: WARNING,
    warn: WARNING,
    error: ERROR,
    disable: ERROR + 1,
};

const levelText = [LOG_UNKNOWN, LOG_DEBUG, LOG_VERBOSE, LOG_INFO, LOG_WARNING, LOG_ERROR, LOG_DISABLE];


export const makeLogger =
    (logger, logLevel, channel) =>
    (level, ...args) => {
        const enabledLogLevel = mapLogLevels[level] >= mapLogLevels[logLevel] ? mapLogLevels[level] : 0;

        if (enabledLogLevel !== 0) {
            let _args = args.length === 1 && typeof args[0] === 'function' ? args[0]() : args;
            Array.isArray(_args) || (_args = [_args]);

            logger(enabledLogLevel, args, channel);
        }
    };

export const consoleLogger = (level, args, channel = null) =>
    (level === ERROR
        ? console.error
        : level === WARNING
        ? console.warn
        : level === TRACE
        ? console.trace
        : console.log)(`${channel ? '[' + channel + '] ' : ''}${levelText[level]}:`, ...args);
