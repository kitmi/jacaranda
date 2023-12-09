import { sleep_ } from '@kitmi/utils';
import { FSM } from '../src';

describe('unit:fsm', function () {
    it('bvt', async function () {
        const atimer = {
            state: 'shutdown',
            time: 0,
            handle: null,
        };

        const transitionTable = {
            shutdown: {
                start: {
                    target: 'running',
                    after: (_, timer) => {
                        console.log('trigger');
                        timer.handle = setInterval(() => {
                            timer.time++;
                        }, 100);
                    },
                },
                stop: {},
            },
            running: {
                start: {
                    when: (_, timer) => {
                        if (timer.time > 10) {
                            return [true];
                        } else {
                            return [false, 'not passed 1 second'];
                        }
                    },
                    before: (_, timer) => {
                        return {
                            time: 0,
                        };
                    },
                },
                stop: {
                    target: 'paused',
                    when: (_, timer) => {
                        if (timer.time > 10) {
                            return [true];
                        } else {
                            return [false, 'not passed 1 second'];
                        }
                    },
                    after: (_, timer) => {
                        if (timer.handle) {
                            clearInterval(timer.handle);
                            timer.handle = null;
                        }
                    },
                },
            },
            paused: {
                start: {
                    target: 'running',
                    when: (_, timer) => {
                        if (timer.handle) return [false, 'already started'];
                        return [true];
                    },
                    after: (_, timer) => {
                        timer.handle = setInterval(() => {
                            timer.time++;
                        }, 100);
                    },
                },
                stop: {
                    target: 'shutdown',
                    when: (_, timer) => {
                        if (timer.handle) return [false, 'not paused'];
                        return [true];
                    },
                    before: (_, timer) => {
                        return {
                            time: 0,
                        };
                    },
                },
            },
        };

        const fsm = new FSM(
            null,
            transitionTable,
            (_, timer) => timer.state,
            (_, timer, data, targetState) => {
                if (targetState) {
                    data = { ...data, state: targetState };
                }

                Object.assign(timer, data);

                return [true];
            }
        );

        let actions = await fsm.getAllowedActions_(atimer, true);
        actions.allowed.length.should.be.exactly(2);
        actions.disallowed.length.should.be.exactly(0);

        await fsm.doAction_('start', atimer);
        atimer.state.should.be.exactly('running');

        actions = await fsm.getAllowedActions_(atimer, true);
        actions.allowed.length.should.be.exactly(0);
        actions.disallowed.length.should.be.exactly(2);
        actions.disallowed[0].reason.should.be.exactly('not passed 1 second');

        await sleep_(1200);

        actions = await fsm.getAllowedActions_(atimer, true);
        actions.allowed.length.should.be.exactly(2);
        actions.disallowed.length.should.be.exactly(0);

        await fsm.doAction_('stop', atimer);
        atimer.state.should.be.exactly('paused');

        actions = await fsm.getAllowedActions_(atimer, true);
        actions.allowed.length.should.be.exactly(2);
        actions.disallowed.length.should.be.exactly(0);

        await fsm.doAction_('start', atimer);
        atimer.state.should.be.exactly('running');

        actions = await fsm.getAllowedActions_(atimer, true);
        actions.allowed.length.should.be.exactly(2);
        actions.disallowed.length.should.be.exactly(0);

        await fsm.doAction_('stop', atimer);
        atimer.state.should.be.exactly('paused');

        await fsm.doAction_('stop', atimer);
        atimer.state.should.be.exactly('shutdown');
    });
});
