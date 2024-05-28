"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return _default;
    },
    normalizeSteps: function() {
        return normalizeSteps;
    }
});
const _utils = require("@kitmi/utils");
const _tasks = /*#__PURE__*/ _interop_require_wildcard(require("./tasks"));
const _bundle = /*#__PURE__*/ _interop_require_default(require("@kitmi/jsonx/bundle"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const JSV = _bundle.default.JSV;
function pushStep(steps, step) {
    if (step.name.startsWith('$')) {
        throw new Error('Invalid step name: ' + step.name);
    }
    steps.push(step);
}
function normalizeSteps(steps) {
    if (Array.isArray(steps)) {
        return steps.reduce((acc, step)=>{
            if (typeof step === 'string') {
                pushStep(acc, {
                    name: step,
                    task: step
                });
            } else if ((0, _utils.isPlainObject)(step)) {
                if (step.task == null) {
                    throw new Error('Task name is required.');
                }
                pushStep(acc, {
                    name: step.task,
                    ...step
                });
            } else {
                throw new Error('Invalid step info: ' + JSON.stringify(step));
            }
            return acc;
        }, []);
    }
    if (!(0, _utils.isPlainObject)(steps)) {
        throw new Error('Invalid steps: ' + JSON.stringify(steps));
    }
    return _utils._.reduce(steps, (acc, stepInfo, name)=>{
        pushStep(acc, {
            name,
            task: name,
            ...stepInfo
        });
        return acc;
    }, []);
}
class Pipeline {
    setVariables(...args) {
        if (this.started) {
            throw new Error('Variables cannot be set after the pipeline is started.');
        }
        if (args.length === 1) {
            this.variables = {
                ...this.variables,
                ...args[0]
            };
        } else if (args.length === 2) {
            this.variables[args[0]] = args[1];
        } else {
            throw new Error('Invalid arguments.');
        }
    }
    getStepVariables() {
        return _utils._.reduce(this.variables, (acc, value, key)=>{
            if (!key.startsWith('$')) {
                acc[key] = value;
            }
            return acc;
        }, {});
    }
    getValue(name) {
        if (name.startsWith('$last.')) {
            const lastStep = this.completed[this.completed.length - 1];
            if (this.processing.index !== lastStep.index + 1) {
                throw new Error(`Last step which is depended by the current step "${this.processing.name}" is failed.`);
            }
            name = lastStep.name + '.' + name.substring(6);
        }
        const value = (0, _utils.get)(this.variables, name);
        if (value === undefined) {
            throw new Error(`Value "${name}" not found from context.`);
        }
        return value;
    }
    setData(...args) {
        if (args.length === 1) {
            this.variables.$data = args[0];
        } else if (args.length === 2) {
            this.variables.$data = {
                ...this.variables.$data,
                [args[0]]: args[1]
            };
        } else {
            throw new Error('Invalid arguments.');
        }
    }
    async run_(input) {
        if (!this.finished) {
            this.started = true;
            this.variables.$input = input;
            this.app.info(`Running job "${this.name}" ...`, {
                job: this.name,
                numSteps: this.steps.length
            });
            await (0, _utils.eachAsync_)(this.steps, async ({ name, task, when, continueOnError, ...stepInfo }, stepIndex)=>{
                if (when) {
                    const [matched, unmatchedReason] = JSV.match(this.variables, when);
                    if (!matched) {
                        this.app.info(`Step "${name}" is skipped due to: ${unmatchedReason}`, {
                            job: this.name,
                            name,
                            task
                        });
                        return;
                    }
                }
                const taskExecutor = this.taskProvider?.getTask(task) || _tasks[task];
                if (taskExecutor == null) {
                    throw new Error(`Task "${task}" not found.`);
                }
                const stepMeta = {
                    name,
                    task,
                    index: stepIndex
                };
                const step = {
                    ...stepMeta,
                    setData: (...args)=>this.setData(...args),
                    getValue: (name)=>this.getValue(name),
                    cloneValues: ()=>({
                            ...this.variables
                        }),
                    replaceValues: (obj)=>_utils._.mapValues(obj, (value)=>{
                            if ((0, _utils.isPlainObject)(value)) {
                                return step.replaceValues(value);
                            }
                            if (typeof value !== 'string') {
                                throw new Error('Value name must be a string, for literal values please use the "define" task.');
                            }
                            return step.getValue(value);
                        }),
                    // pipeline-related output
                    syslog: (level, msg, info)=>this.app.log(level, msg, {
                            job: this.name,
                            ...stepMeta,
                            ...info
                        }),
                    // the business-related output
                    log: (level, msg, info)=>this.stepLogger.log(level, msg, {
                            meta: {
                                job: this.name,
                                ...stepMeta
                            },
                            ...info
                        }),
                    getService: (name)=>{
                        const service = this.app.getService(name);
                        if (service == null) {
                            throw new Error(`Service "${name}" not found.`);
                        }
                        return service;
                    }
                };
                this.processing = stepMeta;
                this.app.info(`Running step "${name}" ... [${stepIndex + 1}/${this.steps.length}]`, {
                    job: this.name,
                    ...stepMeta
                });
                try {
                    this.variables[name] = await taskExecutor(step, stepInfo);
                } catch (error) {
                    if (this.failed == null) {
                        this.failed = [];
                    }
                    this.failed.push(this.processing);
                    delete this.processing;
                    if (continueOnError) {
                        this.app.error(`Error of step "${name}" is ignored as "continueOnError" enabled. ${error.message}`, {
                            job: this.name,
                            ...stepMeta
                        });
                        return;
                    }
                    this.app.error(`Step "${name}" failed.`, {
                        job: this.name,
                        ...stepMeta
                    });
                    throw error;
                }
                this.completed.push(this.processing);
                delete this.processing;
                this.app.info(`Step "${name}" is done.`, {
                    job: this.name,
                    ...stepMeta
                });
            });
            this.finished = true;
        }
        this.app.info(`Job "${this.name}" is completed.`, {
            job: this.name
        });
        this.started = false;
        return this.variables.$data;
    }
    constructor(app, name, steps, { env, taskProvider, stepLogger }){
        this.app = app;
        this.name = name;
        this.steps = steps;
        this.taskProvider = this.app.getService(taskProvider);
        this.stepLogger = this.app.getService(stepLogger);
        this.completed = [];
        this.variables = {
            $app: {
                workingPath: app.workingPath
            },
            $env: env,
            $data: null
        };
        this.failed = null;
        this.processing = null;
        this.started = false;
        this.finished = false;
    }
}
const _default = Pipeline;

//# sourceMappingURL=Pipeline.js.map