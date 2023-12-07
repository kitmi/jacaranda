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
    getChildContext: function() {
        return _jsonv.getChildContext;
    }
});
const _jsonv = require("@kitmi/jsonv");
const transformerHandlers = {};
const mapOfTransformers = {};
//JSON Expression Syntax Runtime Configuration
const config = {
    messages: _jsonv.config.messages,
    addTransformerToMap: (tokens, handler)=>{
        const [tag, isUnary, ...alias] = tokens;
        if (typeof isUnary !== 'boolean') {
            throw new Error('The second param should be a boolean value.');
        }
        alias.forEach((op)=>{
            if (op in mapOfTransformers) {
                throw new Error(`Duplicate transformer alias: "${op}" for operator "${tag}".`);
            }
            mapOfTransformers[op] = [
                tag,
                isUnary
            ];
        });
        if (tag in transformerHandlers) {
            throw new Error(`Duplicate operator name: "${tag}".`);
        }
        transformerHandlers[tag] = handler;
    },
    overrideTransformer: (tag, handler)=>{
        transformerHandlers[tag] = handler;
    },
    getTransformerTagAndType: (op)=>mapOfTransformers[op],
    getTransformer: (tag)=>transformerHandlers[tag],
    setLocale: (locale)=>{
        _jsonv.config.setLocale(locale);
        return config;
    },
    loadMessages: (locale, messages)=>{
        _jsonv.config.loadMessages(locale, messages);
        return config;
    }
};
const _default = config;

//# sourceMappingURL=config.js.map