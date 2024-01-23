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
    Config: function() {
        return Config;
    },
    default: function() {
        return _default;
    },
    getChildContext: function() {
        return getChildContext;
    },
    initContext: function() {
        return initContext;
    }
});
const _utils = require("./utils");
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
class Config {
    addValidatorToMap(tokens, handler) {
        const [tag, ...alias] = tokens;
        alias.forEach((op)=>{
            if (op in this.mapOfValidators) {
                throw new Error(`Duplicate validator alias "${op}" for operator "${tag}".`);
            }
            this.mapOfValidators[op] = tag;
        });
        if (tag in this.validatorHandlers) {
            throw new Error(`Duplicate operator name "${tag}".`);
        }
        return this.overrideValidator(tag, handler);
    }
    overrideValidator(tag, handler) {
        this.validatorHandlers[tag] = handler;
        return this;
    }
    addTransformerToMap(tokens, handler) {
        const [tag, isUnary, ...alias] = tokens;
        if (typeof isUnary !== 'boolean') {
            throw new Error('The second param should be a boolean value.');
        }
        alias.forEach((op)=>{
            if (op in this.mapOfTransformers) {
                throw new Error(`Duplicate transformer alias: "${op}" for operator "${tag}".`);
            }
            this.mapOfTransformers[op] = [
                tag,
                isUnary
            ];
        });
        if (tag in this.transformerHandlers) {
            throw new Error(`Duplicate operator name: "${tag}".`);
        }
        return this.overrideTransformer(tag, handler);
    }
    overrideTransformer(tag, handler) {
        this.transformerHandlers[tag] = handler;
        return this;
    }
    loadMessages(locale, moreMessages) {
        this.messagesCache[locale] = moreMessages;
        return this;
    }
    setLocale(locale) {
        if (locale in this.messagesCache) {
            Object.assign(this.messages, this.messagesCache[locale]);
        }
    }
    constructor(){
        _define_property(this, "validatorHandlers", {});
        _define_property(this, "mapOfValidators", {});
        _define_property(this, "transformerHandlers", {});
        _define_property(this, "mapOfTransformers", {});
        _define_property(this, "messagesCache", {});
        // default message handlers
        _define_property(this, "messages", {
            //Exception messages
            SYNTAX_OP_NOT_ALONE: 'Transformer operator can only be used alone in one pipeline stage.',
            SYNTAX_INVALID_EXPR: (expr)=>`Invalid expression syntax: ${JSON.stringify(expr)}`,
            SYNTAX_INVALID_OP: (op, prefix)=>`Invalid operator "${op}" at ${(0, _utils.formatPath)(prefix)}.`,
            SYNTAX_NUMBER_AS_EXPR: 'Number value cannot be used as a transformer expression.',
            SYNTAX_INVALID_CONTEXT: (key)=>`Invalid context variable "${key}".`,
            INVALID_TRANSFORMER_OP: (op)=>`Invalid transformer operator "${op}".`,
            UNSUPPORTED_VALIDATION_OP: (op, prefix)=>`Unsupported validation operator "${op}" at ${(0, _utils.formatPath)(prefix)}.`,
            INVALID_COLLECTION_OP: (op)=>`Invalid collection operator "${op}".`,
            INVALID_TRANSFORMER_HANDLER: (tag)=>`Handler for transformer "${tag}" not found.`,
            INVALID_TEST_HANLDER: (tag)=>`Handler for validator "${tag}" not found.`,
            INVALID_OP_EXPR: (op, right, expected)=>`Invalid "${op}" expression: ${JSON.stringify(right)}` + (expected ? `, expected: ${JSON.stringify(expected)}.` : '.'),
            INVALID_COLLECTION_OP_EXPR: (collectionOp, op, right)=>`Invalid "${op}" expression for collection "${collectionOp}" traversing: ${JSON.stringify(right)}.`,
            UNSUPPORTED_TYPE: (type)=>`Supported type "${type}".`,
            OPERAND_NOT_TUPLE: (op)=>`The right operand of a collection operator ${op ? '"' + op + '" ' : ''}must be a two-tuple.`,
            OPERAND_NOT_TUPLE_2_OR_3: (op)=>`The right operand of a "${op}" operator must be either a 2-tuple or a 3-tuple.`,
            OPERAND_NOT_ARRAY: (op)=>`The right operand of a "${op}" operator must be an array.`,
            OPERAND_NOT_BOOL: (op)=>`The right operand of a "${op}" operator must be a boolean value.`,
            OPERAND_NOT_STRING: (op)=>`The right operand of a "${op}" operator must be a string.`,
            OPERAND_NOT_OBJECT: (op)=>`The right operand of a "${op}" operator must be an object.`,
            VALUE_NOT_ARRAY: (op)=>`The value to take a "${op}" operator must be an array.`,
            VALUE_NOT_COLLECTION: (op)=>`The value to take a "${op}" operator must be either an object or an array.`,
            VALUE_NOT_PRIMITIVE: (op)=>`The value to take a "${op}" operator must be a primitive value, e.g. string, number.`,
            VALUE_NOT_STRING: (op)=>`The value to take a "${op}" operator must be a string.`,
            VALUE_NOT_OBJECT: (op)=>`The value to take a "${op}" operator must be an object.`,
            VALUE_NOT_BOOL: (op)=>`The evaluated value used as the condition of a "${op}" operator must be a boolean.`,
            REQUIRE_RIGHT_OPERAND: (op)=>`Binary operator "${op}" requires a right operand.`,
            RIGHT_OPERAND_NOT_EMPTY: (op)=>`Unary operator "${op}" does not require a right operand.`,
            MULTI_ERRORS: (numErrors)=>`${numErrors} errors occurred.`
        });
        _define_property(this, "supportedLocales", new Set([
            'en',
            'en-AU',
            'en-GB',
            'en-US',
            'zh',
            'zh-CN',
            'zh-HK',
            'zh-TW'
        ]));
        _define_property(this, "getValidatorTag", (op)=>this.mapOfValidators[op]);
        _define_property(this, "getValidator", (tag)=>this.validatorHandlers[tag]);
        _define_property(this, "getTransformerTagAndType", (op)=>this.mapOfTransformers[op]);
        _define_property(this, "getTransformer", (tag)=>this.transformerHandlers[tag]);
    }
}
//JSON Dynamic Expression Runtime Configuration
const config = new Config();
const initContext = (context, currentValue)=>{
    if (context == null) {
        context = {
            config
        };
    }
    if (!('THIS' in context)) {
        context = {
            ...context,
            THIS: currentValue,
            ROOT: currentValue
        };
    }
    return context;
};
const getChildContext = (context, currentValue, childKey, childValue)=>({
        ...context,
        path: (0, _utils.makePath)(childKey, context.path),
        PARENT: currentValue,
        THIS: childValue,
        KEY: childKey
    });
const _default = config;

//# sourceMappingURL=config.js.map