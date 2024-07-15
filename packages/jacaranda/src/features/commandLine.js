/**
 * Parse command line arguments using minimist and store the parsed object into app.argv, and add app.showUsage() helper function
 * @module Feature_CommandLine
 */

import path from 'node:path';
import { _, pushIntoBucket, eachAsync_ } from '@kitmi/utils';
import { ApplicationError, InvalidConfiguration } from '@kitmi/types';
import Feature from '../Feature';
import minimist from 'minimist';

function translateMinimistOptions(opts) {
    let m = {};

    _.forOwn(opts, (detail, name) => {
        if (detail.bool) {
            pushIntoBucket(m, 'boolean', name);
        } else {
            pushIntoBucket(m, 'string', name);
        }

        if ('default' in detail) {
            _.set(m, `default.${name}`, detail.default);
        }

        if (detail.alias) {
            _.set(m, `alias.${name}`, detail.alias);
        }
    });

    return m;
}

function optionDecorator(name) {
    return name.length == 1 ? '-' + name : '--' + name;
}

let gArgv = process.argv.slice(2);

/**
 * Error caused by command line arguments.
 * @class
 * @extends ApplicationError
 */
class CommandLineArgumentError extends ApplicationError {
    /**
     * @param {string} message - Error message
     * @param {string} name - The related config item
     * @param {boolean} nonOption - Whether it is an option
     */
    constructor(message, name, nonOption) {
        super(message, 'E_CLI_INVALID_ARG', { name, nonOption });
    }
}

/**
 * Command line helper object.
 */
class CommandLine {
    constructor(app, usage) {
        this.app = app;
        this.usage = usage;

        this.parse(usage.options);
    }

    injectUsage(injects) {
        this.injects = injects;
    }

    parse(options) {
        const minimistOpts = translateMinimistOptions(options);
        this.argv = minimist(gArgv, minimistOpts);
    }

    option(name) {
        return this.argv[name];
    }

    arg(name) {
        if (this.args[name]) return this.args[name];

        let index = _.findIndex(this.usage.arguments, (arg) => arg.name === name);

        if (index === -1 || this.argv._.length <= index) {
            return undefined;
        }

        this.args || (this.args = {});
        return (this.args[name] = this.argv._[index]);
    }

    updateOption(name, value) {
        this.argv[name] = value;
        let opts = this.usage.options[name];
        if (opts.alias) {
            _.each(opts.alias, (a) => {
                this.argv[a] = value;
            });
        }
    }

    async valueOrFunctionCall_(functor) {
        if (typeof functor === 'function') {
            return await functor(this);
        }

        return functor;
    }

    async doFilter_(name, opt, argIndex) {
        if (opt.filter) {
            if (typeof argIndex === 'undefined') {
                if (!(typeof opt.filter !== 'function')) {
                    throw new InvalidConfiguration(
                        `The "filter" in the inquirer option for argument option "${name}" should be a function!`,
                        this.app,
                        `commandLine.options[${name}].filter`
                    );
                }

                this.updateOption(name, await opt.filter(this.argv[name], this));
            } else {
                if (!(typeof opt.filter !== 'function')) {
                    throw new InvalidConfiguration(
                        `The "filter" in the inquirer option for argument value "${name}" at position ${argIndex} should be a function!`,
                        this.app,
                        `commandLine.arguments[${argIndex}].filter`
                    );
                }

                this.argv._[argIndex] = await opt.filter(this.argv._[argIndex], this);
            }
        }
    }

    argExist(name, argIndex) {
        return typeof argIndex === 'undefined' ? name in this.argv : this.argv._.length > argIndex;
    }

    async inquire_() {
        const inquirer = await this.app.tryRequire_('inquirer', true);

        const doInquire_ = (item, argIndex) =>
            inquirer.prompt([item]).then((answers) => {
                console.log();

                _.forOwn(answers, (ans, name) => {
                    if (typeof argIndex === 'undefined') {
                        this.updateOption(name, ans);
                    } else {
                        assert: this.argv._.length === argIndex;

                        this.argv._ = this.argv._.concat([ans]);
                    }
                });
            });

        const prepareInquire_ = async (opts, name, argIndex) => {
            let argExists = this.argExist(name, argIndex);

            if ('inquire' in opts && !argExists) {
                //need inquire and the value not given through command line
                let inquire = await this.valueOrFunctionCall_(opts.inquire);

                if (inquire) {
                    let type;
                    let q = { name: name, message: opts.promptMessage || opts.desc };

                    if (opts.promptType) {
                        type = opts.promptType;
                        if (type === 'list' || type === 'rawList' || type === 'checkbox' || type === 'expand') {
                            if (!opts.choicesProvider) {
                                throw new InvalidConfiguration(
                                    typeof argIndex === 'undefined'
                                        ? `Missing "choicesProvider" in the inquirer option for argument option "${name}"!`
                                        : `Missing "choicesProvider" in the inquirer option for argument value "${name}" at postion ${argIndex}!`,
                                    this.app,
                                    typeof argIndex === 'undefined'
                                        ? `commandLine.options[${name}].choicesProvider`
                                        : `commandLine.arguments[${argIndex}].choicesProvider`
                                );
                            }

                            q.choices = await this.valueOrFunctionCall_(opts.choicesProvider);
                        }
                    } else if (opts.bool) {
                        type = 'confirm';
                    } else {
                        type = 'input';
                    }

                    q.type = type;

                    if ('promptDefault' in opts) {
                        q.default = await this.valueOrFunctionCall_(opts.promptDefault);
                    }

                    await doInquire_(q, argIndex);
                    await this.doFilter_(name, opts, argIndex);

                    if (opts.afterInquire) {
                        await opts.afterInquire(this);
                    }
                }
            } else if (argExists) {
                await this.doFilter_(name, opts, argIndex);
                if (opts.onArgumentExists) {
                    await opts.onArgumentExists(this);
                }
            }

            if ((await this.valueOrFunctionCall_(this.usage.showArguments)) && this.argExist(name, argIndex)) {
                if (typeof argIndex === 'undefined') {
                    console.log('option', name, `(${opts.desc})`, ':', this.argv[name]);
                } else {
                    console.log(`<${name}>`, ':', this.argv._[argIndex]);
                }
            }
        };

        if (!_.isEmpty(this.usage.arguments)) {
            await eachAsync_(this.usage.arguments, async (argOpt, index) => {
                let { name, ...opts } = argOpt;

                return prepareInquire_(opts, name, index);
            });
        }

        return (
            _.isEmpty(this.usage.options) || eachAsync_(this.usage.options, (opts, name) => prepareInquire_(opts, name))
        );
    }

    /**
     * validate parsed and filled argument options.
     */
    async validate_() {
        const checkRequire_ = (opts) => this.valueOrFunctionCall_(opts.required);

        let errors = [];

        if (!_.isEmpty(this.usage.arguments)) {
            let argNum = this.argv._.length;

            if (argNum < this.usage.arguments.length) {
                let args = [];

                let i = 0;

                await eachAsync_(this.usage.arguments, async (arg) => {
                    let required = await checkRequire_(arg);

                    if (required) {
                        if (i >= argNum) {
                            let msg = `Missing required argument "${arg.name}"!`;

                            if (this.usage.showUsageOnError) {
                                errors.push(msg);
                            } else {
                                throw new CommandLineArgumentError(msg, arg.name, true);
                            }
                        } else {
                            args.push(this.argv._[i++]);
                        }
                    }
                });

                this.argv._ = args;
            }
        }

        this.usage.options &&
            (await eachAsync_(this.usage.options, async (opts, name) => {
                let required = await checkRequire_(opts);

                if (required && !(name in this.argv)) {
                    let msg = `Missing required argument option of "${name}"!`;

                    if (this.usage.showUsageOnError) {
                        errors.push(msg);
                    } else {
                        throw new CommandLineArgumentError(msg, name);
                    }
                }
            }));

        if (errors.length > 0) {
            this.showUsage({
                afterBanner: () => 'Error(s):\n' + errors.map((msg) => ' - ' + msg).join('\n') + '\n\n',
            });

            process.exit(1);
        }
    }

    async processSilentModeArguments_() {
        if (this.usage.arguments) {
            await eachAsync_(this.usage.arguments, async (arg, index) => {
                if (this.argv._.length <= index) {
                    if (arg.hasOwnProperty('silentModeDefault')) {
                        for (let i = this.argv._.length; i < index; i++) {
                            this.argv._.push(undefined);
                        }

                        this.argv._.push(await this.valueOrFunctionCall_(arg.silentModeDefault));
                    }
                } else {
                    const { name, ...opts } = arg;
                    await this.doFilter_(name, opts, index);
                    if (opts.onArgumentExists) {
                        await opts.onArgumentExists(this);
                    }
                }
            });
        }

        if (this.usage.options) {
            await eachAsync_(this.usage.options, async (opts, name) => {
                if (this.argExist(name)) {
                    await this.doFilter_(name, opts);
                    if (opts.onArgumentExists) {
                        await opts.onArgumentExists(this);
                    }
                } else if (opts.hasOwnProperty('silentModeDefault')) {
                    this.updateOption(name, await this.valueOrFunctionCall_(opts.silentModeDefault));
                }
            });
        }
    }

    getBanner() {
        if (this.usage.banner) {
            let banner = '';

            if (typeof this.usage.banner === 'function') {
                banner += this.usage.banner(this);
            } else if (typeof this.usage.banner === 'string') {
                banner += this.usage.banner;
            } else {
                throw new InvalidConfiguration(
                    'Invalid banner value of commandLine feature.',
                    this.app,
                    `commandLine.banner`
                );
            }

            banner += '\n';

            return banner;
        }

        return undefined;
    }

    getUsage(injects) {
        injects = { ...this.injects, ...injects };

        let usage = '';

        let banner = !this.bannerShown && this.getBanner();
        if (banner) {
            usage += banner + '\n';
        }

        if (injects && injects.afterBanner) {
            usage += injects.afterBanner();
        }

        let fmtArgs = '';
        if (!_.isEmpty(this.usage.arguments)) {
            fmtArgs =
                ' ' + this.usage.arguments.map((arg) => (arg.required ? `<${arg.name}>` : `[${arg.name}]`)).join(' ');
        }

        usage += `Usage: ${this.usage.program || path.basename(process.argv[1])}${fmtArgs} [options]\n\n`;

        if (injects && injects.afterCommandLine) {
            usage += injects.afterCommandLine();
        }

        if (!_.isEmpty(this.usage.options)) {
            usage += `Options:\n`;
            _.forOwn(this.usage.options, (opts, name) => {
                let line = '  ' + optionDecorator(name);
                if (opts.alias) {
                    line += _.reduce(opts.alias, (sum, a) => sum + ', ' + optionDecorator(a), '');
                }

                line += '\n';
                line += '    ' + opts.desc + '\n';

                if ('default' in opts) {
                    line += '    default: ' + opts.default.toString() + '\n';
                }

                if (opts.required) {
                    if (typeof opts.required === 'function') {
                        line += '    conditional\n';
                    } else {
                        line += '    required\n';
                    }
                }

                if (opts.choicesProvider && Array.isArray(opts.choicesProvider)) {
                    line += '    available values:\n';
                    opts.choicesProvider.forEach((choice) => {
                        line += `        "${choice.value}": ${choice.name}\n`;
                    });
                }

                line += '\n';

                usage += line;
            });
        }

        if (injects && injects.afterOptions) {
            usage += injects.afterOptions();
        }

        return usage;
    }

    showBannar() {
        let banner = this.getBanner();
        if (banner) {
            console.log(banner);
            this.bannerShown = true;
        }
    }

    showUsage(injects) {
        console.log(this.getUsage(injects));
    }
}

export default {
    /**
     * This feature is loaded at initialization stage
     * @member {string}
     */
    stage: Feature.INIT,

    packages: ['minimist', 'inquirer'],

    /**
     * Load the feature
     * @param {App} app - The cli app module object
     * @param {object} usageOptions - Options for the feature
     * @property {string} [usageOptions.banner] - Banner message or banner generator function
     * @property {string} [usageOptions.program] - Executable name
     * @property {array} [usageOptions.arguments] - Command line arguments, identified by the position of appearance
     * @property {object} [usageOptions.options] - Command line options
     * @property {boolean|function} [usageOptions.silentMode] - Whether to run in silient mode, default false
     * @property {boolean|function} [usageOptions.nonValidationMode] - Whether to run validation
     * @property {boolean} [usageOptions.showUsageOnError]
     *
     * @example
     *   options: { [argumentKey]: {
     *      desc, // {string} - description
     *      alias, // {array.<string>} - alias array
     *      bool, // {boolean} - whether it is a boolean value
     *      default, // {*} - default value
     *      inquire, // {boolean | function(cli).<boolean>} - whether to enable interactive query
     *      promptMessage, // {string} - prompt message for query, will use desc if not set
     *      promptType, // {string} - prompt type, can be one of [ input, number, confirm, list, rawlist, expand, checkbox, password, editor ]
     *      promptDefault, // {* | function(cli).<*>} - default value appeared on query or a async function to return the default value
     *      choicesProvider, // {array | function(cli).<array> | function.<function(string).<array>>} - required for prompt type list, rawlist, expand, checkbox
     *      filter, // {function(argv, cli).<argv>} - filter to process the argument value
     *      afterInquire, // {function} - after inquire hook,
     *      onArgumentExists, // {function} - when argument exists,
     *      silentModeDefault // {*} - default value when run in silient mode,
     *   } }
     *
     * Note: If you need to override option value during parsing, you should call `updateOption(name, value)` to automatically update all alias as well
     *
     * @returns {Promise.<*>}
     */
    load_: async (app, options, name) => {
        const { testArgs, ...usageOptions } = app.featureConfig(
            options,
            {
                schema: {
                    testArgs: { type: 'array', optional: true },
                },
                keepUnsanitized: true,
            },
            name
        );

        if (testArgs) {
            gArgv = testArgs;
        }

        app.commandLine = new CommandLine(app, usageOptions);

        let silentMode = usageOptions.silentMode;

        if (silentMode && typeof silentMode === 'function') {
            silentMode = silentMode(app.commandLine);
        }

        app.commandLine.silentMode = silentMode;

        if (silentMode) {
            await app.commandLine.processSilentModeArguments_();
        } else {
            app.commandLine.showBannar();
            await app.commandLine.inquire_();
        }

        let nonValidationMode = usageOptions.nonValidationMode;

        if (nonValidationMode && typeof nonValidationMode === 'function') {
            nonValidationMode = nonValidationMode(app.commandLine);
        }

        app.commandLine.nonValidationMode = nonValidationMode;

        if (!nonValidationMode) {
            await app.commandLine.validate_();
        }
    },
};
