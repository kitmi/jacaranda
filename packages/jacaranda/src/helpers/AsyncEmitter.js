import { pushIntoBucket, batchAsync_ } from '@kitmi/utils';

class AsyncEmitter {
    constructor() {
        this._handlers = {};
    }

    on(event, handler) {
        pushIntoBucket(this._handlers, event, { once: false, handler });
        return this;
    }

    once(event, handler) {
        pushIntoBucket(this._handlers, event, { once: true, handler });
        return this;
    }

    off(event, handler) {
        let handlers = this._handlers[event];
        if (!handlers || handlers.length === 0) {
            return this;
        }

        if (handler) {
            let index = handlers.findIndex((item) => item.handler === handler);
            if (index >= 0) {
                handlers.splice(index, 1);
            }
        } else {
            delete this._handlers[event];
        }

        return this;
    }

    allOff() {
        this._handlers = {};
        return this;
    }

    async emit_(event, ...args) {
        let handlers = this._handlers[event];
        if (!handlers || handlers.length === 0) {
            return false;
        }

        const _handlers = [...handlers];
        const filtered = handlers.filter((item) => !item.once);

        if (filtered.length === 0) {
            delete this._handlers[event];
        } else {
            this._handlers[event] = filtered;
        }         

        await batchAsync_(_handlers, (item) => item.handler(...args));

        return true;
    }
}

export default AsyncEmitter;
