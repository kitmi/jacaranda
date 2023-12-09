import { eachAsync_ } from '@kitmi/utils';
import { InvalidArgument, Forbidden } from '@kitmi/types';

class FiniteStateMachine {
    /**
     * OK result
     * @memberof FiniteStateMachine
     * @static
     * @type {Array}
     */
    static OK = [true];

    /**
     * Fail with a reason
     * @memberof FiniteStateMachine
     * @static
     * @param {*} reason
     * @returns {Array}
     */
    static fail = (reason) => [false, reason];

    /**
     * Trigger all actions in the array
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array
     * @returns {function}
     */
    static triggerAll =
        (array) =>
        async (...args) =>
            eachAsync_(array, (action_) => action_(...args));

    /**
     * If any of the conditions in the array is met, return OK, otherwise fail with a reason.
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array 
     * @returns {function}
     */
    static ifAny =
        (array) =>
        async (...args) => {
            const l = array.length;
            const reasons = [];

            for (let i = 0; i < l; i++) {
                const checker_ = array[i];

                const [allowed, disallowedReason] = await checker_(...args);
                if (allowed) {
                    return FiniteStateMachine.OK;
                }

                reasons.push(disallowedReason);
            }

            return FiniteStateMachine.fail('None of the required conditions met.\n' + reasons.join('\n'));
        };

    /**
     * If all of the conditions in the array are met, return OK, otherwise fail with a reason.
     * @memberof FiniteStateMachine
     * @static
     * @param {Array} array 
     * @returns {function}
     */
    static ifAll =
        (array) =>
        async (...args) => {
            const l = array.length;

            for (let i = 0; i < l; i++) {
                const checker_ = array[i];

                const [allowed, disallowedReason] = await checker_(...args);
                if (!allowed) {
                    return FiniteStateMachine.fail(disallowedReason);
                }
            }

            return FiniteStateMachine.OK;
        };

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
     */
    constructor(app, transitionTable, stateFetcher, stateUpdater) {
        this.app = app;

        this.transitions = transitionTable;
        this.stateFetcher_ = stateFetcher;
        this.stateUpdater_ = stateUpdater;
    }

    /**
     * Get a list of allowed actions based on the current state.
     * @param {*} context
     * @param {boolean} withDisallowedReason
     */
    async getAllowedActions_(context, withDisallowedReason) {
        const currentState = await this.stateFetcher_(this.app, context);

        // from state
        const transitions = this.transitions[currentState];
        if (!transitions) {
            throw new InvalidArgument(`State "${currentState}" rules not found in the transition table.`);
        }

        const allowed = [];
        const disallowed = [];

        await eachAsync_(transitions, async (rule, action) => {
            const [actionAllowed, disallowedReason] =
                (rule.when && (await rule.when(this.app, context))) || FiniteStateMachine.OK;

            if (actionAllowed) {
                allowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target,
                });
            } else if (withDisallowedReason) {
                disallowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target,
                    reason: disallowedReason,
                });
            }
        });

        const ret = {
            allowed,
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
     */
    async doAction_(action, context, payload, fetcherOpts, updaterOpts) {
        const currentState = await this.stateFetcher_(this.app, context, fetcherOpts);

        const transitions = this.transitions[currentState];
        if (!transitions) {
            throw new InvalidArgument(`State "${currentState}" rules not found in the transition table.`);
        }

        const rule = transitions && transitions[action];
        if (!rule) {
            throw new Forbidden(`Action "${action}" is not allowed in "${currentState}" state.`);
        }

        if (rule.when) {
            const [allowed, disallowedReason] = await rule.when(this.app, context);
            if (!allowed) {
                throw new Forbidden(
                    disallowedReason || `The current state does not meet the requirements of "${action}" action.`
                );
            }
        }

        const entityUpdate = (rule.before && (await rule.before(this.app, context, payload))) || { ...payload };
        const [actuallyUpdated, updateResult] = await this.stateUpdater_(
            this.app,
            context,
            entityUpdate,
            rule.target,
            updaterOpts
        );

        if (actuallyUpdated && rule.after) {
            await rule.after(this.app, context);
        }

        return updateResult;
    }
}

export default FiniteStateMachine;
