import { formatPath, makePath } from './utils';

const validatorHandlers = {};
const mapOfValidators = {};

/**
 * Creates a new context object that represents the context of a child object within a larger data structure.
 * @param {Object} context - The current context of the data structure.
 * @param {*} currentValue - The current value of the object that the child object belongs to.
 * @param {string} childKey - The key of the child object within the parent object.
 * @param {*} childValue - The value of the child object.
 * @returns {Object} A new context object that represents the context of the child object within the larger data structure.
 */
export const getChildContext = (context, currentValue, childKey, childValue, extra) => ({
    ...context,
    ...extra,
    path: makePath(childKey, context.path),
    $$PARENT: currentValue,
    $$CURRENT: childValue,
    $$KEY: childKey,
});

export const contextVarKeys = new Set(['$$', '$$ROOT', '$$PARENT', '$$CURRENT', '$$KEY']);

export const messages = {
    //Exception messages
    SYNTAX_OP_NOT_ALONE: 'Transformer operator can only be used alone in one pipeline stage.',
    SYNTAX_INVALID_EXPR: (expr) => `Invalid expression syntax: ${JSON.stringify(expr)}`, // complext expr, not split out operator yet
    SYNTAX_INVALID_OP: (op, prefix) => `Invalid operator "${op}" at ${formatPath(prefix)}.`,
    SYNTAX_NUMBER_AS_EXPR: 'Number value cannot be used as a transformer expression.',
    SYNTAX_INVALID_CONTEXT: (key) => `Invalid context variable "${key}".`,

    INVALID_TRANSFORMER_OP: (op) => `Invalid transformer operator "${op}".`,
    UNSUPPORTED_VALIDATION_OP: (op, prefix) => `Unsupported validation operator "${op}" at ${formatPath(prefix)}.`,
    INVALID_COLLECTION_OP: (op) => `Invalid collection operator "${op}".`,

    INVALID_TRANSFORMER_HANDLER: (tag) => `Handler for transformer "${tag}" not found.`,
    INVALID_TEST_HANLDER: (tag) => `Handler for validator "${tag}" not found.`,

    INVALID_OP_EXPR: (op, right, expected) =>
        `Invalid "${op}" expression: ${JSON.stringify(right)}` +
        (expected ? `, expected: ${JSON.stringify(expected)}.` : '.'),
    INVALID_COLLECTION_OP_EXPR: (collectionOp, op, right) =>
        `Invalid "${op}" expression for collection "${collectionOp}" traversing: ${JSON.stringify(right)}.`,
    UNSUPPORTED_TYPE: (type) => `Supported type "${type}".`,

    OPERAND_NOT_TUPLE: (op) =>
        `The right operand of a collection operator ${op ? '"' + op + '" ' : ''}must be a two-tuple.`,
    OPERAND_NOT_TUPLE_2_OR_3: (op) => `The right operand of a "${op}" operator must be either a 2-tuple or a 3-tuple.`,
    OPERAND_NOT_ARRAY: (op) => `The right operand of a "${op}" operator must be an array.`,
    OPERAND_NOT_BOOL: (op) => `The right operand of a "${op}" operator must be a boolean value.`,
    OPERAND_NOT_STRING: (op) => `The right operand of a "${op}" operator must be a string.`,
    OPERAND_NOT_OBJECT: (op) => `The right operand of a "${op}" operator must be an object.`,

    VALUE_NOT_ARRAY: (op) => `The value to take a "${op}" operator must be an array.`,
    VALUE_NOT_COLLECTION: (op) => `The value to take a "${op}" operator must be either an object or an array.`,
    VALUE_NOT_PRIMITIVE: (op) => `The value to take a "${op}" operator must be a primitive value, e.g. string, number.`,
    VALUE_NOT_STRING: (op) => `The value to take a "${op}" operator must be a string.`,
    VALUE_NOT_OBJECT: (op) => `The value to take a "${op}" operator must be an object.`,

    REQUIRE_RIGHT_OPERAND: (op) => `Binary operator "${op}" requires a right operand.`,
    RIGHT_OPERAND_NOT_EMPTY: (op) => `Unary operator "${op}" does not require a right operand.`,

    MULTI_ERRORS: (numErrors) => `${numErrors} errors occurred.`,
};

const messagesCache = {};

//JSON Validation Syntax Runtime Configuration
const config = {
    messages,
    addValidatorToMap: (tokens, handler) => {
        const [tag, ...alias] = tokens;

        alias.forEach((op) => {
            if (op in mapOfValidators) {
                throw new Error(`Duplicate validator alias "${op}" for operator "${tag}".`);
            }
            mapOfValidators[op] = tag;
        });

        if (tag in validatorHandlers) {
            throw new Error(`Duplicate operator name "${tag}".`);
        }

        validatorHandlers[tag] = handler;
    },
    overrideValidator: (tag, handler) => {
        validatorHandlers[tag] = handler;
    },

    getValidatorTag: (op) => mapOfValidators[op],
    getValidator: (tag) => validatorHandlers[tag],

    loadMessages: (locale, moreMessages) => {
        messagesCache[locale] = moreMessages;
        return config;
    },
    setLocale: (locale) => {
        if (locale in messagesCache) {
            Object.assign(messages, messagesCache[locale]);
        }
    },
    supportedLocales: new Set(['en', 'en-AU', 'en-GB', 'en-US', 'zh', 'zh-CN', 'zh-HK', 'zh-TW'])
};

export default config;
