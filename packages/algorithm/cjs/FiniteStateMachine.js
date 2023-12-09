"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
const _types = require("@kitmi/types");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
class FiniteStateMachine {
    /**
     * Get a list of allowed actions based on the current state.
     * @param {*} context
     * @param {boolean} withDisallowedReason
     */ async getAllowedActions_(context, withDisallowedReason) {
        const currentState = await this.stateFetcher_(this.app, context);
        // from state
        const transitions = this.transitions[currentState];
        if (!transitions) {
            throw new _types.InvalidArgument(`State "${currentState}" rules not found in the transition table.`);
        }
        const allowed = [];
        const disallowed = [];
        await (0, _utils.eachAsync_)(transitions, async (rule, action)=>{
            const [actionAllowed, disallowedReason] = rule.when && await rule.when(this.app, context) || FiniteStateMachine.OK;
            if (actionAllowed) {
                allowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target
                });
            } else if (withDisallowedReason) {
                disallowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target,
                    reason: disallowedReason
                });
            }
        });
        const ret = {
            allowed
        };
        if (withDisallowedReason) {
            ret.disallowed = disallowed;
        }
        return ret;
    }
    /**
     * Perform the specified action.
     * @param {String} action
     * @param {*} context
     * @param {*} payload
     * @param {*} fetcherOpts
     * @param {*} updaterOpts
     */ async doAction_(action, context, payload, fetcherOpts, updaterOpts) {
        const currentState = await this.stateFetcher_(this.app, context, fetcherOpts);
        const transitions = this.transitions[currentState];
        if (!transitions) {
            throw new _types.InvalidArgument(`State "${currentState}" rules not found in the transition table.`);
        }
        const rule = transitions && transitions[action];
        if (!rule) {
            throw new _types.Forbidden(`Action "${action}" is not allowed in "${currentState}" state.`);
        }
        if (rule.when) {
            const [allowed, disallowedReason] = await rule.when(this.app, context);
            if (!allowed) {
                throw new _types.Forbidden(disallowedReason || `The current state does not meet the requirements of "${action}" action.`);
            }
        }
        const entityUpdate = rule.before && await rule.before(this.app, context, payload) || {
            ...payload
        };
        const [actuallyUpdated, updateResult] = await this.stateUpdater_(this.app, context, entityUpdate, rule.target, updaterOpts);
        if (actuallyUpdated && rule.after) {
            await rule.after(this.app, context);
        }
        return updateResult;
    }
    /**
     * Finite State Machine
     * @constructs FiniteStateMachine
     * @param {*} app - Application instance, can be null if not needed
     * @param {object} transitionTable - { state: { action: { desc, when, target, before, after } } }
     * 
     *  Action rule:
     * <ul>
     *      <li>desc: description of this transition</li>
     *      <li>when: pre transition condition check</li>
     *      <li>target: target state</li>
     *      <li>before: transforming before applying to the state, can be async</li>
     *      <li>after: trigger another action after transition, can be async</li>
     * </ul>
     * @param {function} stateFetcher - (app, context, fetcherOpts) => state
     * @param {function} stateUpdater - (app, context, payload, targetState, updaterOpts) => [actuallyUpdated, updateResult]          
     */ constructor(app, transitionTable, stateFetcher, stateUpdater){
        this.app = app;
        this.transitions = transitionTable;
        this.stateFetcher_ = stateFetcher;
        this.stateUpdater_ = stateUpdater;
    }
}
/**
     * OK result
     * @memberof FiniteStateMachine
     * @static
     * @type {Array}
     */ _define_property(FiniteStateMachine, "OK", [
    true
]);
/**
     * Fail with a reason
     * @memberof FiniteStateMachine
     * @static
     * @param {*} reason
     * @returns {Array}
     */ _define_property(FiniteStateMachine, "fail", (reason)=>[
        false,
        reason
    ]);
/**
     * Trigger all actions in the array
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array
     * @returns {function}
     */ _define_property(FiniteStateMachine, "triggerAll", (array)=>async (...args)=>(0, _utils.eachAsync_)(array, (action_)=>action_(...args)));
/**
     * If any of the conditions in the array is met, return OK, otherwise fail with a reason.
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array 
     * @returns {function}
     */ _define_property(FiniteStateMachine, "ifAny", (array)=>async (...args)=>{
        const l = array.length;
        const reasons = [];
        for(let i = 0; i < l; i++){
            const checker_ = array[i];
            const [allowed, disallowedReason] = await checker_(...args);
            if (allowed) {
                return FiniteStateMachine.OK;
            }
            reasons.push(disallowedReason);
        }
        return FiniteStateMachine.fail('None of the required conditions met.\n' + reasons.join('\n'));
    });
/**
     * If all of the conditions in the array are met, return OK, otherwise fail with a reason.
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array 
     * @returns {function}
     */ _define_property(FiniteStateMachine, "ifAll", (array)=>async (...args)=>{
        const l = array.length;
        for(let i = 0; i < l; i++){
            const checker_ = array[i];
            const [allowed, disallowedReason] = await checker_(...args);
            if (!allowed) {
                return FiniteStateMachine.fail(disallowedReason);
            }
        }
        return FiniteStateMachine.OK;
    });
const _default = FiniteStateMachine;

//# sourceMappingURL=FiniteStateMachine.js.map