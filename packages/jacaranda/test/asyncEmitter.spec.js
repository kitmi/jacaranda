import AsyncEmitter from '../src/helpers/AsyncEmitter';
import { sleep_ } from '@kitmi/utils';

describe('AsyncEmitter', () => {
    let emitter;

    beforeEach(() => {
        emitter = new AsyncEmitter();
    });

    describe('on', () => {
        it('should add a handler to the specified event', () => {
            const handler = () => {};
            emitter.on('test', handler);
            emitter._handlers.should.have.property('test').with.lengthOf(1);
        });

        it('should return the emitter instance', () => {
            const result = emitter.on('test', () => {});
            result.should.equal(emitter);
        });
    });

    describe('once', () => {
        it('should add a one-time handler to the specified event', () => {
            const handler = () => {};
            emitter.once('test', handler);
            emitter._handlers.should.have.property('test').with.lengthOf(1);
            emitter._handlers.test[0].should.have.property('once', true);
        });

        it('should return the emitter instance', () => {
            const result = emitter.once('test', () => {});
            result.should.equal(emitter);
        });
    });

    describe('off', () => {
        it('should remove the specified handler from the specified event', () => {
            const handler1 = () => {};
            const handler2 = () => {};
            emitter.on('test', handler1);
            emitter.on('test', handler2);
            emitter.off('test', handler1);
            emitter._handlers.should.have.property('test').with.lengthOf(1);
            emitter._handlers.test[0].should.have.property('handler', handler2);
        });

        it('should remove all handlers from the specified event if no handler is specified', () => {
            const handler1 = () => {};
            const handler2 = () => {};
            emitter.on('test', handler1);
            emitter.on('test', handler2);
            emitter.off('test');
            emitter._handlers.should.not.have.property('test');
        });

        it('should return the emitter instance', () => {
            const result = emitter.off('test', () => {});
            result.should.equal(emitter);
        });
    });

    describe('allOff', () => {
        it('should remove all handlers from all events', () => {
            emitter.on('test1', () => {});
            emitter.on('test2', () => {});
            emitter.allOff();
            emitter._handlers.should.be.empty;
        });

        it('should return the emitter instance', () => {
            const result = emitter.allOff();
            result.should.equal(emitter);
        });
    });

    describe('emit', () => {
        it('should call all handlers for the specified event with the specified arguments', async () => {
            const executed = {};

            const handler1 = async (...args) => {
                await sleep_(100);
                executed['handler1'] = args;
            };
            const handler2 = (...args) => {
                executed['handler2'] = args;
            };
            emitter.on('test', handler1);
            emitter.on('test', handler2);

            await emitter.emit_('test', 'arg1', 'arg2');

            executed['handler1'].should.be.eql(['arg1', 'arg2']);
            executed['handler2'].should.be.eql(['arg1', 'arg2']);
        });

        it('should remove one-time handlers after they are called', async () => {
            const handler1 = async () => {
                await sleep_(100);
                console.log('handler1', '100ms');
            };
            const handler2 = () => {
                console.log('handler2');
            };
            emitter.once('test', handler1);
            emitter.once('test', handler2);
            await emitter.emit_('test');

            emitter._handlers.should.be.eql({});
        });

        it('should return true if there are handlers for the specified event', async () => {
            emitter.on('test', () => {});
            const result = await emitter.emit_('test');
            result.should.be.true;
        });

        it('should return false if there are no handlers for the specified event', async () => {
            const result = await emitter.emit_('test');
            result.should.be.false;
        });
    });
});
