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
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../../jacaranda/src/Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const IMAGE_SIZE = [
    '256x256',
    '512x512',
    '1024x1024'
];
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'openai'
    ],
    load_: async function(app, options, name) {
        const OpenAI = await app.tryRequire_('openai');
        const { embeddingModel, asrModel, ..._options } = app.featureConfig(options, {
            schema: {
                organization: {
                    type: 'text'
                },
                apiKey: {
                    type: 'text'
                },
                asrModel: {
                    type: 'text',
                    default: 'whisper-1'
                },
                embeddingModel: {
                    type: 'text',
                    default: 'text-embedding-ada-002'
                }
            }
        });
        const openai = new OpenAI(_options);
        const service = {
            get maxEmbeddingTokens () {
                return 8191; // depends on embeddingModel
            },
            systemMessage: (content)=>({
                    role: 'system',
                    content
                }),
            userMessage: (content)=>({
                    role: 'user',
                    content
                }),
            assistantMessage: (content)=>({
                    role: 'assistant',
                    content
                }),
            functionMessage: (name, content)=>({
                    role: 'function',
                    name,
                    content
                }),
            listModels_: async ()=>{
                const result = await openai.listModels();
                return result.data;
            },
            createAgent: (options)=>({
                    async call (messages, { model, temperature, top_n, stop }) {
                        const req = (0, _utils.xNull)({
                            model,
                            messages,
                            ...options,
                            temperature,
                            top_n,
                            stop
                        });
                        return service.getChatCompletion_(req);
                    }
                }),
            getEmbeddings_: async (textOrArray)=>{
                try {
                    const result = await openai.createEmbedding({
                        model: embeddingModel,
                        input: textOrArray
                    });
                    return result.data; // array of embeddings
                } catch (err) {
                    let error = err.response ? err.response.data.error : err;
                    throw new _types.ExternalServiceError('Failed to createEmbedding', error);
                }
            },
            getChatCompletion_: async (request)=>{
                try {
                    const result = await openai.chat.completions.create(request);
                    return result;
                } catch (err) {
                    if (err instanceof OpenAI.APIError) {
                        console.log(err.status); // 400
                        console.log(err.name); // BadRequestError
                        console.log(err.headers); // {server: 'nginx', ...}
                        throw new _types.ExternalServiceError('Failed to createChatCompletion', err);
                    } else {
                        throw err;
                    }
                }
            },
            /**
             * Speech to text
             * @param audioStream
             */ getAudioTranscription_: async (audioStream)=>{
                try {
                    const response = await openai.createTranscription(audioStream, asrModel);
                    if (response) {
                        return response.data;
                    }
                } catch (err) {
                    let error = err.response ? err.response.data.error : err;
                    throw new _types.ExternalServiceError('Failed to createTranscription', error);
                }
                return undefined;
            },
            generatImage_: async (prompt, imageSizeScale, userId)=>{
                const size = IMAGE_SIZE[imageSizeScale ?? 0];
                try {
                    const response = await openai.createImage({
                        prompt,
                        n: 1,
                        size,
                        user: userId
                    });
                    if (response) {
                        return response.data[0];
                    }
                } catch (err) {
                    let error = err.response ? err.response.data.error : err;
                    throw new _types.ExternalServiceError('Failed to createImage', error);
                }
                return undefined;
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=openai.js.map