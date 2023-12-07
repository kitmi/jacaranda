import { config as _config } from '@kit/jsonv';

export { getChildContext } from '@kit/jsonv';

const transformerHandlers = {};
const mapOfTransformers = {};

//JSON Expression Syntax Runtime Configuration
const config = {
    messages: _config.messages,

    addTransformerToMap: (tokens, handler) => {
        const [tag, isUnary, ...alias] = tokens;

        if (typeof isUnary !== 'boolean') {
            throw new Error('The second param should be a boolean value.');
        }

        alias.forEach((op) => {
            if (op in mapOfTransformers) {
                throw new Error(`Duplicate transformer alias: "${op}" for operator "${tag}".`);
            }
            mapOfTransformers[op] = [tag, isUnary];
        });

        if (tag in transformerHandlers) {
            throw new Error(`Duplicate operator name: "${tag}".`);
        }

        transformerHandlers[tag] = handler;
    },
    overrideTransformer: (tag, handler) => {
        transformerHandlers[tag] = handler;
    },

    getTransformerTagAndType: (op) => mapOfTransformers[op],
    getTransformer: (tag) => transformerHandlers[tag],

    setLocale: (locale) => {
        _config.setLocale(locale);
        return config;
    },

    loadMessages: (locale, messages) => {
        _config.loadMessages(locale, messages);
        return config;
    },
};

export default config;
