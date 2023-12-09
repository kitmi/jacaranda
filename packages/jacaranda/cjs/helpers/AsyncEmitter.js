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
class AsyncEmitter {
    on(event, handler) {
        (0, _utils.pushIntoBucket)(this._handlers, event, {
            once: false,
            handler
        });
        return this;
    }
    once(event, handler) {
        (0, _utils.pushIntoBucket)(this._handlers, event, {
            once: true,
            handler
        });
        return this;
    }
    off(event, handler) {
        let handlers = this._handlers[event];
        if (!handlers || handlers.length === 0) {
            return this;
        }
        if (handler) {
            let index = handlers.findIndex((item)=>item.handler === handler);
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
        const _handlers = [
            ...handlers
        ];
        this._handlers[event] = handlers.filter((item)=>!item.once);
        await (0, _utils.batchAsync_)(_handlers, (item)=>item.handler(...args));
        return true;
    }
    constructor(){
        this._handlers = {};
    }
}
const _default = AsyncEmitter;

//# sourceMappingURL=AsyncEmitter.js.map